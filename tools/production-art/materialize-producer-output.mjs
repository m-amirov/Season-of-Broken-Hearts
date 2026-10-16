import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function pngDetails(file) {
  const bytes = fs.readFileSync(file);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature) || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw blocked('ART_SOURCE_NOT_PNG', `Producer output is not a valid PNG signature: ${file}`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bytes: bytes.length
  };
}

function blocked(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.status = 'BLOCKED_ART_OUTPUT';
  error.details = details;
  return error;
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/**
 * Materialize one already-generated native PNG into the project-owned tree.
 * This transports bytes only; CEOS art-output-verify remains the mandatory
 * production gate and must run immediately after this function succeeds.
 */
export function materializeProducerOutput({
  projectRoot,
  source,
  destination,
  expectedSha256,
  expectedWidth,
  expectedHeight
} = {}) {
  const root = path.resolve(projectRoot ?? process.cwd());
  const sourcePath = path.resolve(source ?? '');
  const destinationPath = path.resolve(root, destination ?? '');

  if (!source || !fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw blocked('ART_FILE_NOT_FOUND', `Native producer output is missing: ${sourcePath}`);
  }
  if (!inside(root, destinationPath)) {
    throw blocked('ART_DESTINATION_OUTSIDE_PROJECT', `Destination is outside the project root: ${destinationPath}`);
  }
  if (fs.existsSync(destinationPath)) {
    throw blocked('ART_FILE_EXISTS', `Refusing to overwrite project-owned output: ${destinationPath}`);
  }

  const sourceDetails = pngDetails(sourcePath);
  const sourceSha256 = sha256File(sourcePath);
  if (expectedSha256 && sourceSha256.toLowerCase() !== String(expectedSha256).toLowerCase()) {
    throw blocked('ART_SOURCE_SHA_MISMATCH', 'Native producer output hash does not match the declared provenance.', {
      expectedSha256,
      actualSha256: sourceSha256
    });
  }
  if (expectedWidth !== undefined && sourceDetails.width !== Number(expectedWidth)) {
    throw blocked('ART_SOURCE_DIMENSION_MISMATCH', 'Native producer output width does not match the declared contract.', {
      expectedWidth: Number(expectedWidth),
      actualWidth: sourceDetails.width
    });
  }
  if (expectedHeight !== undefined && sourceDetails.height !== Number(expectedHeight)) {
    throw blocked('ART_SOURCE_DIMENSION_MISMATCH', 'Native producer output height does not match the declared contract.', {
      expectedHeight: Number(expectedHeight),
      actualHeight: sourceDetails.height
    });
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  const temporaryPath = path.join(path.dirname(destinationPath), `.producer-output-${crypto.randomUUID()}.tmp`);
  try {
    fs.copyFileSync(sourcePath, temporaryPath);
    // The hard-link makes the final name appear only after the complete copy
    // exists and fails if another process created the destination meanwhile.
    fs.linkSync(temporaryPath, destinationPath);
    fs.unlinkSync(temporaryPath);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    if (error.code === 'EEXIST') {
      throw blocked('ART_FILE_EXISTS', `Refusing to overwrite project-owned output: ${destinationPath}`);
    }
    throw blocked('ART_OUTPUT_TRANSPORT_FAILED', `Could not materialize native producer output: ${error.message}`, {
      source: sourcePath,
      destination: destinationPath
    });
  }

  const destinationDetails = pngDetails(destinationPath);
  const destinationSha256 = sha256File(destinationPath);
  if (destinationSha256 !== sourceSha256 || destinationDetails.bytes !== sourceDetails.bytes) {
    fs.unlinkSync(destinationPath);
    throw blocked('ART_OUTPUT_TRANSPORT_INTEGRITY', 'Materialized output differs from the native producer bytes.', {
      sourceSha256,
      destinationSha256,
      sourceBytes: sourceDetails.bytes,
      destinationBytes: destinationDetails.bytes
    });
  }

  return {
    schemaVersion: 1,
    status: 'PASS_ART_OUTPUT_MATERIALIZED',
    source: sourcePath,
    sourceExists: true,
    sourceSha256,
    destination: path.relative(root, destinationPath).split(path.sep).join('/'),
    destinationSha256,
    bytes: destinationDetails.bytes,
    width: destinationDetails.width,
    height: destinationDetails.height,
    transport: 'native-generated-image-materialization'
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    args[key] = argv[i + 1]?.startsWith('--') ? true : argv[++i];
  }
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const result = materializeProducerOutput({
      projectRoot: args.project ?? process.cwd(),
      source: args.source,
      destination: args.destination,
      expectedSha256: args.sha256,
      expectedWidth: args.width,
      expectedHeight: args.height
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const result = {
      schemaVersion: 1,
      status: error.status ?? 'BLOCKED_ART_OUTPUT',
      code: error.code ?? 'ART_OUTPUT_TRANSPORT_FAILED',
      message: error.message,
      ...(error.details ?? {})
    };
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 2;
  }
}
