"""
AI-Powered Cyber Defense System - Telemetry Data Generator
Simulates realistic enterprise host and network security telemetry with distinct attack signatures:
- Benign (Normal Operations)
- Malware (Trojans, Spyware, Backdoors, C2 beacons)
- Phishing (Credential harvesting, Suspicious URL/payload, Spear phishing)
- Ransomware (Mass file encryption, high disk entropy, process abuse)
- DDoS / Infiltration (High packet rate, port scanning, volumetric flooding)
"""

import numpy as np
import pandas as pd
import os

def generate_cyber_telemetry(n_samples: int = 5000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates synthetic enterprise network and endpoint telemetry data.
    
    Parameters:
        n_samples (int): Total number of security logs to generate.
        random_state (int): Seed for reproducibility.
        
    Returns:
        pd.DataFrame: Simulated security telemetry dataset.
    """
    np.random.seed(random_state)
    
    # Define attack classes with realistic proportion
    # 40% Benign, 20% Malware, 15% Phishing, 15% Ransomware, 10% DDoS
    classes = ['Benign', 'Malware', 'Phishing', 'Ransomware', 'DDoS']
    class_probs = [0.40, 0.20, 0.15, 0.15, 0.10]
    
    assigned_classes = np.random.choice(classes, size=n_samples, p=class_probs)
    
    records = []
    
    protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'SMB', 'SSH', 'FTP']
    dest_ports = [80, 443, 53, 22, 445, 8080, 3389, 21, 8443, 25]
    
    for i, label in enumerate(assigned_classes):
        log_id = f"SEC-LOG-{100000 + i}"
        
        # Base normal values
        packet_count = np.random.poisson(lam=120)
        byte_count = int(packet_count * np.random.uniform(200, 800))
        duration_sec = np.random.exponential(scale=15.0) + 0.1
        src_bytes_ratio = np.random.uniform(0.3, 0.7)
        failed_logins = np.random.choice([0, 1, 2], p=[0.90, 0.08, 0.02])
        cpu_usage_pct = np.random.uniform(5.0, 35.0)
        ram_usage_pct = np.random.uniform(15.0, 50.0)
        file_io_rate_mb = np.random.uniform(0.5, 10.0)
        file_entropy_score = np.random.uniform(2.0, 4.5)  # Normal files have lower entropy (2-4.5)
        dns_query_rate = np.random.poisson(lam=5)
        url_length = int(np.random.normal(loc=35, scale=12))
        url_length = max(10, url_length)
        suspicious_keywords_count = 0
        connection_count_10m = np.random.poisson(lam=8)
        syn_ack_ratio = np.random.uniform(0.85, 1.15)
        privilege_escalation_flag = 0
        crypto_api_calls = np.random.poisson(lam=2)
        ip_reputation_score = np.random.uniform(0.80, 1.0) # 1.0 = Clean, 0.0 = Malicious
        protocol = np.random.choice(protocols, p=[0.30, 0.15, 0.20, 0.20, 0.08, 0.03, 0.02, 0.02])
        dest_port = np.random.choice(dest_ports, p=[0.25, 0.35, 0.12, 0.05, 0.05, 0.08, 0.04, 0.02, 0.02, 0.02])
        
        # Inject Attack Signatures
        if label == 'Malware':
            cpu_usage_pct = np.random.uniform(30.0, 75.0)
            ram_usage_pct = np.random.uniform(40.0, 85.0)
            failed_logins = np.random.choice([0, 1, 3, 5], p=[0.50, 0.25, 0.15, 0.10])
            crypto_api_calls = np.random.poisson(lam=18)
            dns_query_rate = np.random.poisson(lam=25)
            suspicious_keywords_count = np.random.choice([1, 2, 3, 4], p=[0.35, 0.35, 0.20, 0.10])
            ip_reputation_score = np.random.uniform(0.10, 0.45)
            privilege_escalation_flag = np.random.choice([0, 1], p=[0.45, 0.55])
            protocol = np.random.choice(['TCP', 'HTTP', 'HTTPS', 'DNS', 'SSH'], p=[0.25, 0.25, 0.20, 0.20, 0.10])
            dest_port = np.random.choice([4444, 8080, 443, 22, 3389, 53], p=[0.25, 0.25, 0.20, 0.10, 0.10, 0.10])
            src_bytes_ratio = np.random.uniform(0.6, 0.95)
            
        elif label == 'Phishing':
            url_length = int(np.random.normal(loc=95, scale=25))
            url_length = max(45, url_length)
            suspicious_keywords_count = np.random.choice([2, 3, 4, 6], p=[0.30, 0.40, 0.20, 0.10])
            failed_logins = np.random.choice([1, 2, 4, 6], p=[0.25, 0.35, 0.25, 0.15])
            dns_query_rate = np.random.poisson(lam=15)
            ip_reputation_score = np.random.uniform(0.05, 0.40)
            protocol = np.random.choice(['HTTP', 'HTTPS', 'DNS'], p=[0.45, 0.45, 0.10])
            dest_port = np.random.choice([80, 443, 8080], p=[0.40, 0.50, 0.10])
            byte_count = int(np.random.uniform(1500, 8000))
            duration_sec = np.random.uniform(2.0, 20.0)
            
        elif label == 'Ransomware':
            file_io_rate_mb = np.random.uniform(80.0, 350.0)  # Extreme disk I/O burst
            file_entropy_score = np.random.uniform(6.8, 7.98) # High Shannon entropy (encrypted blocks)
            cpu_usage_pct = np.random.uniform(70.0, 99.5)
            ram_usage_pct = np.random.uniform(60.0, 95.0)
            crypto_api_calls = np.random.poisson(lam=85)     # Extensive encryption calls
            privilege_escalation_flag = np.random.choice([0, 1], p=[0.20, 0.80])
            suspicious_keywords_count = np.random.choice([1, 2, 4], p=[0.30, 0.50, 0.20])
            ip_reputation_score = np.random.uniform(0.10, 0.50)
            protocol = np.random.choice(['SMB', 'TCP', 'HTTPS'], p=[0.45, 0.35, 0.20])
            dest_port = np.random.choice([445, 139, 443, 8080], p=[0.40, 0.25, 0.20, 0.15])
            
        elif label == 'DDoS':
            packet_count = int(np.random.poisson(lam=4500))  # Massive packet burst
            byte_count = int(packet_count * np.random.uniform(80, 250))
            duration_sec = np.random.uniform(0.05, 5.0)
            connection_count_10m = int(np.random.poisson(lam=350))
            syn_ack_ratio = np.random.uniform(3.5, 15.0)     # Unanswered SYN flood
            cpu_usage_pct = np.random.uniform(65.0, 95.0)
            ip_reputation_score = np.random.uniform(0.05, 0.35)
            protocol = np.random.choice(['TCP', 'UDP', 'DNS', 'HTTP'], p=[0.40, 0.35, 0.15, 0.10])
            dest_port = np.random.choice([80, 443, 53, 8080, 22], p=[0.35, 0.30, 0.20, 0.10, 0.05])
            
        # Add realistic sensor noise and rounding
        records.append({
            'log_id': log_id,
            'duration_sec': round(float(duration_sec), 2),
            'protocol': protocol,
            'dest_port': int(dest_port),
            'packet_count': int(packet_count),
            'byte_count': int(byte_count),
            'src_bytes_ratio': round(float(src_bytes_ratio), 3),
            'failed_logins': int(failed_logins),
            'cpu_usage_pct': round(float(cpu_usage_pct), 2),
            'ram_usage_pct': round(float(ram_usage_pct), 2),
            'file_io_rate_mb': round(float(file_io_rate_mb), 2),
            'file_entropy_score': round(float(file_entropy_score), 3),
            'dns_query_rate': int(dns_query_rate),
            'url_length': int(url_length),
            'suspicious_keywords_count': int(suspicious_keywords_count),
            'connection_count_10m': int(connection_count_10m),
            'syn_ack_ratio': round(float(syn_ack_ratio), 2),
            'privilege_escalation_flag': int(privilege_escalation_flag),
            'crypto_api_calls': int(crypto_api_calls),
            'ip_reputation_score': round(float(ip_reputation_score), 3),
            'threat_label': label
        })
        
    df = pd.DataFrame(records)
    return df

def save_raw_dataset(output_path: str = "data/raw_cyber_security_telemetry.csv", n_samples: int = 5000):
    """Generates and saves the raw cyber defense dataset."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df = generate_cyber_telemetry(n_samples=n_samples)
    df.to.csv(output_path, index=False)
    print(f"[+] Successfully generated {len(df)} cybersecurity telemetry records to '{output_path}'")
    print(f"[+] Class Breakdown:\n{df['threat_label'].value_counts(normalize=True)}")
    return df

if __name__ == "__main__":
    save_raw_dataset()
