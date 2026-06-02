function runSystemAction(action) {
  return {
    actionId: action.id,
    tool: action.tool,
    status: "completed",
    detail: `System action stub executed: ${action.label}`
  };
}

function runBrowserAction(action) {
  return {
    actionId: action.id,
    tool: action.tool,
    status: "completed",
    detail: `Browser action stub executed: ${action.label}`
  };
}

function runGenericAction(action) {
  return {
    actionId: action.id,
    tool: action.tool,
    status: "completed",
    detail: `Generic action stub executed: ${action.label}`
  };
}

export function executeActions(actions) {
  return actions.map((action) => {
    if (action.tool.includes("system")) {
      return runSystemAction(action);
    }
    if (action.tool.includes("browser")) {
      return runBrowserAction(action);
    }
    return runGenericAction(action);
  });
}
