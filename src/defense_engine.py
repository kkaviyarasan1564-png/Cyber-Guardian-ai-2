"""
AI-Powered Cyber Defense System - Defense Engine & SOAR Automation
Provides real-time threat detection, anomaly scoring, automated mitigation playbooks,
and incident response containment execution.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

class CyberDefenseEngine:
    """
    Intelligent Autonomous Cyber Defense Engine for Threat Detection and Real-Time Mitigation.
    """
    def __init__(self, models_dir: str = "models"):
        self.models_dir = models_dir
        self.preprocessor_bundle = None
        self.best_model = None
        self.all_models = None
        self.anomaly_detector = None
        self.feature_names = None
        self.metadata = None
        self.load_artifacts()
        
    def load_artifacts(self):
        """Loads all serialized models, preprocessors, and metadata."""
        prep_path = os.path.join(self.models_dir, "cyber_preprocessor.joblib")
        model_path = os.path.join(self.models_dir, "best_cyber_model.joblib")
        all_models_path = os.path.join(self.models_dir, "all_cyber_models.joblib")
        anomaly_path = os.path.join(self.models_dir, "cyber_anomaly_detector.joblib")
        feat_path = os.path.join(self.models_dir, "cyber_feature_names.joblib")
        meta_path = os.path.join(self.models_dir, "cyber_model_metadata.json")
        
        if os.path.exists(prep_path):
            bundle = joblib.load(prep_path)
            self.pipeline = bundle['pipeline']
            self.label_encoder = bundle['label_encoder']
            
        if os.path.exists(model_path):
            self.best_model = joblib.load(model_path)
            
        if os.path.exists(all_models_path):
            self.all_models = joblib.load(all_models_path)
            
        if os.path.exists(anomaly_path):
            self.anomaly_detector = joblib.load(anomaly_path)
            
        if os.path.exists(feat_path):
            self.feature_names = joblib.load(feat_path)
            
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as f:
                self.metadata = json.load(f)

    def analyze_event(self, event_dict: dict, model_name: str = None) -> dict:
        """
        Analyzes a single cybersecurity telemetry event and returns real-time defense actions.
        """
        df_input = pd.DataFrame([event_dict])
        
        # Transform features
        X_trans = self.pipeline.transform(df_input)
        
        # Select Model
        if model_name and self.all_models and model_name in self.all_models:
            active_model = self.all_models[model_name]
        else:
            active_model = self.best_model
            
        # Prediction & Probabilities
        pred_idx = active_model.predict(X_trans)[0]
        predicted_threat = self.label_encoder.inverse_transform([pred_idx])[0]
        probabilities = active_model.predict_proba(X_trans)[0]
        
        class_probs = {
            cls: float(round(prob * 100, 2))
            for cls, prob in zip(self.label_encoder.classes_, probabilities)
        }
        
        confidence_pct = class_probs[predicted_threat]
        
        # Anomaly Detection Score
        anomaly_score = 0.0
        is_novel_anomaly = False
        if self.anomaly_detector:
            raw_anomaly = float(self.anomaly_detector.decision_function(X_trans)[0])
            # Normalize to 0-100% anomaly risk
            anomaly_score = round(max(0.0, min(100.0, (0.2 - raw_anomaly) * 150)), 2)
            is_novel_anomaly = raw_anomaly < -0.05
            
        # Determine Severity Level
        severity, color, risk_score = self._compute_severity(predicted_threat, confidence_pct, anomaly_score)
        
        # Generate Automated SOAR Mitigation Playbook
        mitigation = self._generate_mitigation_playbook(predicted_threat, severity, event_dict)
        
        # Explainable Threat Factors
        threat_factors = self._extract_threat_factors(event_dict, predicted_threat)
        
        return {
            "predicted_threat": predicted_threat,
            "confidence_percentage": confidence_pct,
            "severity_level": severity,
            "severity_color": color,
            "overall_risk_score": risk_score,
            "anomaly_score": anomaly_score,
            "is_novel_anomaly": is_novel_anomaly,
            "class_probabilities": class_probs,
            "mitigation_playbook": mitigation,
            "key_threat_factors": threat_factors,
            "model_used": model_name or self.metadata.get("best_model", "Random Forest")
        }

    def _compute_severity(self, threat: str, confidence: float, anomaly_score: float):
        """Calculates CVSS-aligned Threat Severity."""
        if threat == 'Benign':
            if anomaly_score > 75:
                return "LOW (Suspicious Anomaly)", "#f1c40f", 35.0
            return "BENIGN (Secure)", "#2ecc71", 5.0
            
        base_threat_weights = {
            'Ransomware': 95.0,
            'Malware': 82.0,
            'Phishing': 75.0,
            'DDoS': 80.0
        }
        
        base_weight = base_threat_weights.get(threat, 70.0)
        final_risk = (base_weight * (confidence / 100.0)) + (anomaly_score * 0.15)
        final_risk = min(100.0, round(final_risk, 1))
        
        if final_risk >= 80:
            return "CRITICAL", "#e74c3c", final_risk
        elif final_risk >= 60:
            return "HIGH", "#e67e22", final_risk
        elif final_risk >= 40:
            return "MEDIUM", "#f39c12", final_risk
        else:
            return "LOW", "#3498db", final_risk

    def _generate_mitigation_playbook(self, threat: str, severity: str, event: dict) -> dict:
        """Generates automated SOAR response action commands and tactical guidance."""
        dest_port = event.get('dest_port', 80)
        protocol = event.get('protocol', 'TCP')
        
        playbooks = {
            "Ransomware": {
                "title": "🚨 Urgent Ransomware Neutralization & Host Containment",
                "actions": [
                    f"🛑 ISOLATE HOST: Cut endpoint network adapter to halt lateral SMB/RPC traversal.",
                    f"🔪 KILL PROCESS: Terminate PID with high I/O burst and crypto library hooks.",
                    f"🔒 BLOCK PORT {dest_port}: Block ingress/egress port {dest_port} on core firewalls.",
                    f"💾 RESTORE SNAPSHOT: Trigger immutable VSS volume shadow copy / ZFS backup rollback.",
                    f"🛡️ AUDIT PRIVILEGES: Revoke compromised service account credential tokens."
                ],
                "firewall_rule": f"iptables -A FORWARD -p {protocol.lower()} --dport {dest_port} -j DROP",
                "recommended_status": "AUTOMATED CONTAINMENT ACTIVE"
            },
            "Malware": {
                "title": "🦠 Malware C2 Beacon Quarantine & Memory Forensics",
                "actions": [
                    f"🧪 QUARANTINE FILE: Relocate suspicious binary into secure sandbox repository.",
                    f"🛑 SINKHOLE C2 IP: Blacklist destination IP and drop outgoing {protocol} packets.",
                    f"🔍 MEMORY DUMP: Execute volatility memory acquisition for malicious DLL injection scan.",
                    f"🔄 EDR SCAN: Trigger aggressive deep-heuristic endpoint antivirus sweep.",
                    f"🔑 RESET SECRETS: Invalidate cached Kerberos and NTLM hashes."
                ],
                "firewall_rule": f"firewalld-cmd --add-rich-rule='rule service name=\"{protocol.lower()}\" drop'",
                "recommended_status": "THREAT QUARANTINED"
            },
            "Phishing": {
                "title": "🎣 Phishing Vector Suppression & Domain Takedown",
                "actions": [
                    f"🌐 DNS SINKHOLE: Update corporate DNS to resolve spoofed domain to 127.0.0.1.",
                    f"✉️ PURGE INBOXES: Global Exchange/M365 message trace & hard delete matching phishing links.",
                    f"🔐 FORCE SSO RE-AUTH: Expire active session cookies for target user accounts.",
                    f"🛡️ WAF FILTER: Apply regex URL filtering on reverse proxy perimeter.",
                    f"📢 SOC ALERT: Dispatch targeted phishing warning to relevant departmental group."
                ],
                "firewall_rule": f"pihole -b suspicious-phishing-domain.com",
                "recommended_status": "CREDENTIAL PROTECTION ENGAGED"
            },
            "DDoS": {
                "title": "🌊 Volumetric DDoS Rate-Limiting & Traffic Scrubbing",
                "actions": [
                    f"⚡ TRAFFIC SCRUBBING: Route incoming {protocol} traffic through Cloudflare / Akamai scrubbing center.",
                    f"🛡️ SYN-COOKIE ENABLE: Activate kernel TCP SYN-cookie defense against SYN flood.",
                    f"🚦 DYNAMIC RATE LIMIT: Cap maximum connections per source IP to 50 conn/min.",
                    f"🌐 BGP BLACKHOLE: Advertise BGP community string to upstream ISP for volumetric damping.",
                    f"📊 SCALE AUTOSCALING: Spin up auxiliary edge gateway instances."
                ],
                "firewall_rule": f"iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT",
                "recommended_status": "ACTIVE RATE MITIGATION"
            },
            "Benign": {
                "title": "✅ Standard Security Telemetry Monitoring",
                "actions": [
                    "📈 MAINTAIN BASELINE: Telemetry falls within expected behavioral distributions.",
                    "🔍 LOG RETENTION: Archive event to SIEM Elasticsearch cluster (30-day retention).",
                    "✨ ZERO ESCALATION REQUIRED: System operating with nominal health parameters."
                ],
                "firewall_rule": "ALLOW (Pass-through)",
                "recommended_status": "ALL SYSTEMS SECURE"
            }
        }
        
        return playbooks.get(threat, playbooks["Benign"])

    def _extract_threat_factors(self, event: dict, threat: str) -> list:
        """Highlights the top telemetry indicators contributing to this threat detection."""
        factors = []
        
        if event.get('file_entropy_score', 0) > 6.5:
            factors.append(f"High Shannon File Entropy ({event['file_entropy_score']}) indicates active file encryption.")
        if event.get('crypto_api_calls', 0) > 15:
            factors.append(f"Abnormal Cryptographic API calls count: {event['crypto_api_calls']} calls/sec.")
        if event.get('file_io_rate_mb', 0) > 50:
            factors.append(f"Massive Disk I/O Throughput: {event['file_io_rate_mb']} MB/s.")
        if event.get('syn_ack_ratio', 0) > 3.0:
            factors.append(f"Unbalanced SYN/ACK Ratio ({event['syn_ack_ratio']}) indicates SYN Flood / DDoS behavior.")
        if event.get('url_length', 0) > 70:
            factors.append(f"Excessive URL Length ({event['url_length']} chars) typical in obfuscated phishing links.")
        if event.get('suspicious_keywords_count', 0) >= 2:
            factors.append(f"Suspicious payload keyword hits: {event['suspicious_keywords_count']} tokens.")
        if event.get('ip_reputation_score', 1.0) < 0.4:
            factors.append(f"Malicious IP Reputation Score ({event['ip_reputation_score']}) flagged in Threat Intelligence.")
        if event.get('privilege_escalation_flag', 0) == 1:
            factors.append("Unauthorized Privilege Escalation detected on OS Kernel.")
        if event.get('failed_logins', 0) >= 3:
            factors.append(f"Repeated Failed Authentication attempts: {event['failed_logins']} attempts.")
        if event.get('cpu_usage_pct', 0) > 75:
            factors.append(f"High CPU Utilization spike ({event['cpu_usage_pct']}%).")
            
        if not factors:
            factors.append("Telemetry metrics conform to standard benign operational thresholds.")
            
        return factors

    def batch_analyze(self, df: pd.DataFrame, model_name: str = None) -> pd.DataFrame:
        """Processes a batch dataframe of telemetry logs and returns classified results."""
        df_clean = df.drop(columns=['log_id', 'threat_label'], errors='ignore')
        X_trans = self.pipeline.transform(df_clean)
        
        if model_name and self.all_models and model_name in self.all_models:
            active_model = self.all_models[model_name]
        else:
            active_model = self.best_model
            
        preds = active_model.predict(X_trans)
        probs = active_model.predict_proba(X_trans)
        predicted_labels = self.label_encoder.inverse_transform(preds)
        
        df_result = df.copy()
        df_result['Predicted_Threat'] = predicted_labels
        df_result['Threat_Confidence'] = [round(float(np.max(p)) * 100, 1) for p in probs]
        
        if self.anomaly_detector:
            raw_anom = self.anomaly_detector.decision_function(X_trans)
            df_result['Anomaly_Score'] = [round(max(0.0, min(100.0, (0.2 - score) * 150)), 1) for score in raw_anom]
        else:
            df_result['Anomaly_Score'] = 0.0
            
        severities = []
        for threat, conf, anom in zip(predicted_labels, df_result['Threat_Confidence'], df_result['Anomaly_Score']):
            sev, _, _ = self._compute_severity(threat, conf, anom)
            severities.append(sev)
            
        df_result['Severity'] = severities
        return df_result

if __name__ == "__main__":
    engine = CyberDefenseEngine()
    sample_event = {
        'duration_sec': 12.5,
        'protocol': 'SMB',
        'dest_port': 445,
        'packet_count': 320,
        'byte_count': 150000,
        'src_bytes_ratio': 0.85,
        'failed_logins': 2,
        'cpu_usage_pct': 88.5,
        'ram_usage_pct': 80.0,
        'file_io_rate_mb': 150.0,
        'file_entropy_score': 7.6,
        'dns_query_rate': 12,
        'url_length': 40,
        'suspicious_keywords_count': 2,
        'connection_count_10m': 18,
        'syn_ack_ratio': 1.1,
        'privilege_escalation_flag': 1,
        'crypto_api_calls': 75,
        'ip_reputation_score': 0.25
    }
    result = engine.analyze_event(sample_event)
    print("\n--- DEFENSE ENGINE DIAGNOSTIC ---")
    print(f"Threat: {result['predicted_threat']} ({result['confidence_percentage']}%)")
    print(f"Severity: {result['severity_level']}")
    print(f"Mitigation: {result['mitigation_playbook']['title']}")
