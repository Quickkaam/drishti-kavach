// ============================================
// Drishti Kavach — Security Service
// MITRE ATT&CK Mapping + Threat Analysis
// ============================================

// MITRE ATT&CK mappings for detected attack types
const MITRE_MAP = {
  sqli:              { id: 'T1190', tactic: 'Initial Access',        name: 'Exploit Public-Facing Application' },
  xss:               { id: 'T1059.007', tactic: 'Execution',         name: 'JavaScript/JScript' },
  path_traversal:    { id: 'T1083',    tactic: 'Discovery',          name: 'File and Directory Discovery' },
  command_injection: { id: 'T1059',    tactic: 'Execution',          name: 'Command and Scripting Interpreter' },
  honeypot_trigger:  { id: 'T1595',    tactic: 'Reconnaissance',     name: 'Active Scanning' },
  brute_force:       { id: 'T1110',    tactic: 'Credential Access',  name: 'Brute Force' },
  csrf:              { id: 'T1185',    tactic: 'Collection',         name: 'Browser Session Hijacking' },
  url_attack:        { id: 'T1190',    tactic: 'Initial Access',     name: 'Exploit Public-Facing Application' },
  form_attack:       { id: 'T1190',    tactic: 'Initial Access',     name: 'Exploit Public-Facing Application' },
  url_manipulation:  { id: 'T1190',    tactic: 'Initial Access',     name: 'Exploit Public-Facing Application' },
};

const getMitreMapping = (eventType) => {
  return MITRE_MAP[eventType] || MITRE_MAP['url_attack'];
};

const getSeverityFromType = (eventType, payload = '') => {
  const critical = ['sqli', 'command_injection', 'path_traversal'];
  const high = ['xss', 'brute_force', 'csrf'];
  const medium = ['honeypot_trigger', 'url_attack', 'form_attack'];

  if (critical.includes(eventType)) return 'critical';
  if (high.includes(eventType)) return 'high';
  if (medium.includes(eventType)) return 'medium';
  return 'low';
};

module.exports = { getMitreMapping, getSeverityFromType, MITRE_MAP };
