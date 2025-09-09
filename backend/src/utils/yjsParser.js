import * as Y from "yjs";

// Simple Y.js state handler - no parsing, just return states
const yjsParser = {
  // Just return the Y.js states - let frontend handle everything
  getStates: (currentVersion, previousVersion) => {
    return {
      currentState: currentVersion.yjsState,
      previousState: previousVersion?.yjsState || null,
      timestamp: currentVersion.timestamp,
      savedBy: currentVersion.savedBy,
    };
  },
};

export { yjsParser };
