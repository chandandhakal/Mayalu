const callSessions = {};

export function getCallSessions() {
  return callSessions;
}

export function setCallSession(sid, session) {
  callSessions[sid] = session;
}

export function deleteCallSession(sid) {
  delete callSessions[sid];
}
