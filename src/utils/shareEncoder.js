import LZString from 'lz-string';

export function encodeTourState(state) {
  // 1. Take the complete tour state
  const payload = {
    t: state.tourName || '',
    s: state.tappe || [],
    a: state.attivita || {},
    b: state.budgetItems || [],
    c: state.checklist || [],
    ty: state.tourType || 'generic',
    bt: state.budgetTotale || 0
  };

  try {
    const jsonStr = JSON.stringify(payload);
    return LZString.compressToEncodedURIComponent(jsonStr);
  } catch (err) {
    console.error("Error encoding tour", err);
    return null;
  }
}

export function decodeTourState(encodedStr) {
  try {
    let jsonStr = LZString.decompressFromEncodedURIComponent(encodedStr);
    
    if (!jsonStr) {
      // Fallback in case it wasn't compressed properly
      try {
        jsonStr = decodeURIComponent(atob(encodedStr));
      } catch (e) {
        return null; // Both failed
      }
    }

    if (!jsonStr) return null;

    const payload = JSON.parse(jsonStr);
    return {
      tourName: payload.t || '',
      tappe: payload.s || [],
      attivita: payload.a || {},
      budgetItems: payload.b || [],
      checklist: payload.c || [],
      tourType: payload.ty || 'generic',
      budgetTotale: payload.bt || 0
    };
  } catch (err) {
    console.error("Error decoding tour", err);
    return null;
  }
}

