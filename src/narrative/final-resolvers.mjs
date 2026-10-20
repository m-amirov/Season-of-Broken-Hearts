const clone = value => structuredClone(value);

export const RELATIONSHIP_ENDING_IDS = Object.freeze([
  'matteo-hope',
  'matteo-goodbye',
  'leo-second-chance',
  'leo-echo',
  'elio-table-for-two',
  'elio-separate-kitchens',
  'nika-own-way'
]);

export const HOTEL_OUTCOME_IDS = Object.freeze(['independence', 'limited-investment', 'sale']);

export function resolveRelationshipEnding(state) {
  const next = clone(state);
  if (next.endingId && next.endingId !== 'unresolved') return next;

  if (next.route === 'matteo') {
    next.endingId = next.ep10FinalAction === 'matteo-shared-plan' &&
      next.trustMatteo >= 3 &&
      next.relationshipMatteo >= 3 &&
      next.matteoCommitment === 'mutual-plan' &&
      next.matteoCareerChoice === 'delegation' &&
      next.publicDisclosure === 'full'
      ? 'matteo-hope'
      : 'matteo-goodbye';
  } else if (next.route === 'leo') {
    next.endingId = next.ep10FinalAction === 'leo-verified-step' &&
      next.trustLeo >= 3 &&
      next.relationshipLeo >= 3 &&
      next.leoAccountability === 'verified' &&
      next.leoCareerChoice === 'heritage-plan'
      ? 'leo-second-chance'
      : 'leo-echo';
  } else if (next.route === 'elio') {
    next.endingId = next.ep10FinalAction === 'elio-two-kitchens' &&
      next.trustElio >= 3 &&
      next.relationshipElio >= 3 &&
      next.elioClarity === 'discussed' &&
      next.elioCareerChoice === 'hybrid-plan'
      ? 'elio-table-for-two'
      : 'elio-separate-kitchens';
  } else if (next.route === 'independent') {
    next.endingId = next.ep10FinalAction === 'independent-portfolio' &&
      next.independentProgress === 'self-authored' &&
      next.nikaCareerPlan === 'portfolio'
      ? 'nika-own-way'
      : 'unresolved';
  }
  return next;
}

export function resolveHotelOutcome(state) {
  const next = clone(state);
  if (next.hotelOutcome && next.hotelOutcome !== 'unresolved') return next;

  if (next.alternativeBudget === 'viable' &&
      next.staffTrust >= 4 &&
      next.fundingEvidence >= 3 &&
      next.staffProtection === 'secured' &&
      next.publicDisclosure === 'full') {
    next.hotelOutcome = 'independence';
  } else if (next.investorTerms === 'limited-investment' &&
      next.staffTrust >= 3 &&
      next.staffProtection === 'secured' &&
      next.publicDisclosure === 'full') {
    next.hotelOutcome = 'limited-investment';
  } else {
    next.hotelOutcome = 'sale';
  }
  return next;
}

export function resolveSceneState(state, scene) {
  if (scene?.resolver === 'relationship-ending') return resolveRelationshipEnding(state);
  if (scene?.resolver === 'hotel-outcome') return resolveHotelOutcome(state);
  return clone(state);
}
