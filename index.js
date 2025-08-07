<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Odyssey-1: Unified Sovereign Deployment</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family= Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    
    <!-- Pyodide -->
    <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>

    <!-- three.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

    <!-- Firebase SDKs -->
    <script type="module">
        // These imports are essential for Firebase functionality
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // Make functions and variables globally accessible
        window.initializeApp = initializeApp;
        window.getAuth = getAuth;
        window.signInAnonymously = signInAnonymously;
        window.signInWithCustomToken = signInWithCustomToken;
        window.onAuthStateChanged = onAuthStateChanged;
        window.getFirestore = getFirestore;
        window.doc = doc;
        window.getDoc = getDoc;
        window.setDoc = setDoc;
        window.onSnapshot = onSnapshot;
        window.collection = collection;
        window.setLogLevel = setLogLevel;
    </script>

    <style>
        body { font-family: 'Inter', sans-serif; background-color: #0c111d; overflow: hidden; }
        .font-fira { font-family: 'Fira Code', monospace; }
        .glass-pane { background-color: rgba(17, 24, 39, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(55, 65, 81, 0.3); }
        .status-light { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 5px, 0 0 10px; }
        .status-green { background-color: #22c55e; box-shadow-color: #22c55e; }
        .status-amber { background-color: #f59e0b; box-shadow-color: #f59e0b; }
        .status-red { background-color: #ef4444; box-shadow-color: #ef4444; }
        .status-blue { background-color: #3b82f6; box-shadow-color: #3b82f6; }
        .terminal-input::placeholder { color: #4b5563; }
        .log-entry { border-left: 2px solid #374151; padding-left: 1rem; }
        .log-user { border-left-color: #3b82f6; }
        .log-ai { border-left-color: #10b981; }
        .log-system { border-left-color: #f59e0b; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1f2937; }
        ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
        #vr-container canvas { display: block; width: 100%; height: 100%; }
        .tab-button { background-color: transparent; border: none; padding: 0.5rem 1rem; color: #9ca3af; cursor: pointer; font-size: 0.875rem; }
        .tab-button.active { color: #ffffff; border-bottom: 2px solid #3b82f6; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .input-field {
            background-color: rgba(17, 24, 39, 0.7);
            border: 1px solid #374151;
        }
    </style>
</head>
<body class="text-gray-200">

    <div id="dashboard" class="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-screen">
        <!-- Left Column -->
        <div class="lg:col-span-1 flex flex-col gap-4">
            <div class="glass-pane p-4 rounded-lg flex flex-col">
                <h2 class="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">QPAI System Status</h2>
                <div id="status-brain" class="flex items-center justify-between mb-3"><span class="font-fira">Cognitive Engine</span><div class="flex items-center gap-2"><span id="brain-status-text" class="text-amber-400 font-fira">INITIALIZING</span><div id="brain-status-light" class="status-light status-amber"></div></div></div>
                <div id="status-db" class="flex items-center justify-between mb-3"><span class="font-fira">Database (Firestore)</span><div class="flex items-center gap-2"><span id="db-status-text" class="text-amber-400 font-fira">CONNECTING</span><div id="db-status-light" class="status-light status-amber"></div></div></div>
                <div id="status-key" class="flex items-center justify-between"><span class="font-fira">Sovereign Key</span><div class="flex items-center gap-2"><span id="key-status-text" class="text-amber-400 font-fira">AWAITING AUTH</span><div id="key-status-light" class="status-light status-amber"></div></div></div>
                <div class="mt-auto pt-4">
                    <h3 class="text-lg font-bold text-white mb-2">Brain Activity</h3>
                    <div id="brain-activity" class="font-fira text-sm text-cyan-400 bg-black/30 p-3 rounded h-24 overflow-hidden"><p>&gt; Awaiting system initialization...</p></div>
                </div>
            </div>
            <!-- Command Log -->
            <div class="glass-pane p-4 rounded-lg flex flex-col flex-grow">
                <h2 class="text-xl font-bold text-white mb-4">Commands</h2>
                <div id="log-container" class="flex-grow overflow-y-auto pr-2 space-y-4 mb-4"></div>
                <div class="mt-auto">
                    <form id="command-form" class="flex items-center gap-2">
                        <input type="text" id="command-input" class="flex-grow bg-black/50 border border-gray-600 rounded p-3 font-fira text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Initializing..." disabled>
                        <button type="button" id="speak-btn-old" class="hidden">Speak</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Center Column (now spans 2 cols) -->
        <div class="lg:col-span-2 flex flex-col gap-4">
            <!-- VR/3D Visualization -->
            <div class="glass-pane rounded-lg flex-grow flex flex-col relative h-1/4">
                <h2 class="text-xl font-bold text-white p-4 absolute top-0 left-0 z-10">Odyssey-1 Core Visualization</h2>
                <div id="vr-container" class="flex-grow rounded-lg"></div>
            </div>
            <!-- Document Viewer -->
            <div id="viewport" class="glass-pane rounded-lg flex-grow flex flex-col relative h-3/4">
                <h2 class="text-xl font-bold text-white p-4 absolute top-0 left-0 z-10">Document & Bid Viewer</h2>
                <div id="document-viewer" class="p-4 pt-16 h-full">
                    <pre id="document-content" class="font-fira text-sm whitespace-pre-wrap h-full overflow-y-auto text-gray-300"></pre>
                </div>
                <!-- Moved Speak button to the bottom -->
                <div class="p-4 pt-0">
                    <button type="button" id="speak-btn" class="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-gray-500 disabled:cursor-not-allowed" disabled>
                        <!-- A clean, simple microphone SVG icon -->
                        <svg class="h-5 w-5 inline-block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" clip-rule="evenodd" />
                            <path fill-rule="evenodd" d="M4 10a4 4 0 018 0v2.025a7.5 7.5 0 00-3.565 0L12 12a4 4 0 11-8 0v-2zm1.75 3.025a6.001 6.001 0 008.5 0L14 13a4 4 0 10-8 0L5.75 13.025z" clip-rule="evenodd" />
                            <path fill-rule="evenodd" d="M10 18a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                        Speak
                    </button>
                </div>
            </div>
        </div>

        <!-- Right Column (Odyssey-1 Toolkit) -->
        <div class="lg:col-span-1 flex flex-col gap-4">
            <div class="glass-pane p-4 rounded-lg flex-grow flex flex-col">
                <h2 class="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Odyssey-1</h2>
                <!-- Tab Navigation -->
                <div class="flex border-b border-gray-700 mb-4">
                    <button class="tab-button active" data-tab="bid-calculator">Profitability Engine</button>
                    <button class="tab-button" data-tab="agreement">Covenant Architect</button>
                </div>

                <!-- Bid Calculator Tab -->
                <div id="bid-calculator" class="tab-content active overflow-y-auto">
                    <h3 class="text-md font-semibold text-cyan-400 mb-3">Project Bid Architect</h3>
                    <div class="space-y-3">
                         <div>
                            <label for="client-name-input" class="block text-sm font-medium text-gray-300">Client Name</label>
                            <input type="text" id="client-name-input" placeholder="e.g., Jane Doe" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                        </div>
                        <div>
                            <label for="address-input" class="block text-sm font-medium text-gray-300">Property Address</label>
                            <div class="flex gap-2 mt-1">
                                <input type="text" id="address-input" placeholder="e.g., 123 Main St, Athens, GA" class="w-full p-2 font-fira input-field rounded-md text-white">
                                <button id="fetch-data-btn" class="bg-indigo-600 hover:bg-indigo-700 text-xs px-2 rounded-md">Fetch</button>
                            </div>
                        </div>
                        <div>
                            <label for="zip-code-input" class="block text-sm font-medium text-gray-300">Zip Code</label>
                            <input type="text" id="zip-code-input" placeholder="e.g., 30601" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                        </div>
                        <div>
                            <label for="sq-ft-input" class="block text-sm font-medium text-gray-300">SqFt</label>
                            <input type="number" id="sq-ft-input" placeholder="Auto-populated or manual entry" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label for="hours-input" class="block text-sm font-medium text-gray-300">Hours / Visit</label>
                                <input type="number" id="hours-input" placeholder="e.g., 4" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                            </div>
                            <div>
                                <label for="supply-cost-input" class="block text-sm font-medium text-gray-300">Supply Cost</label>
                                <input type="number" id="supply-cost-input" placeholder="e.g., 150" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label for="people-select" class="block text-sm font-medium text-gray-300"># Employ</label>
                                <select id="people-select" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                    <option value="6">6</option>
                                    <option value="7">7</option>
                                    <option value="8">8</option>
                                    <option value="9">9</option>
                                    <option value="10">10</option>
                                </select>
                            </div>
                             <div>
                                <label for="price-sqft-input" class="block text-sm font-medium text-gray-300">Price/SqFt</label>
                                <input type="number" id="price-sqft-input" placeholder="e.g., 0.15" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Contract Type</label>
                            <div class="flex gap-4 mt-1">
                                <label class="flex items-center"><input type="radio" name="contract-type" value="monthly" class="mr-1" checked> Monthly</label>
                                <label class="flex items-center"><input type="radio" name="contract-type" value="one-time" class="mr-1"> One-Time</label>
                            </div>
                        </div>
                        <div>
                            <label for="frequency-select" class="block text-sm font-medium text-gray-300">Service Frequency (Visits/Week)</label>
                            <select id="frequency-select" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="5">5</option>
                                <option value="7">7</option>
                            </select>
                        </div>
                        <div>
                            <label for="service-specs-select" class="block text-sm font-medium text-gray-300">Service Package</label>
                            <select id="service-specs-select" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                                <option value="" disabled selected>Select a service package...</option>
                                <option value="standard">Standard Cleaning Package</option>
                                <option value="deep">Deep Clean & Sanitization</option>
                                <option value="full-service">Full-Service Janitorial</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-700">
                        <button id="calculate-bid-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Architect Bid
                        </button>
                    </div>
                </div>

                <!-- Service Agreement Tab -->
                <div id="agreement" class="tab-content">
                    <h3 class="text-md font-semibold text-cyan-400 mb-3">Service Agreement Architect</h3>
                    <div class="space-y-3">
                        <div>
                            <label for="client-name" class="block text-sm font-medium text-gray-300">Client Full Name / Business Name</label>
                            <input type="text" id="client-name" placeholder="e.g., ABC Corporation, LLC" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                        </div>
                        <div>
                            <label for="client-address" class="block text-sm font-medium text-gray-300">Client Service Address</label>
                            <input type="text" id="client-address" placeholder="e.g., 456 Oak Ave, Athens, GA" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                        </div>
                         <div>
                            <label for="service-cost" class="block text-sm font-medium text-gray-300">Monthly Service Cost ($)</label>
                            <input type="number" id="service-cost" placeholder="e.g., 1500" class="w-full mt-1 p-2 font-fira input-field rounded-md text-white">
                        </div>
                    </div>
                     <div class="mt-4 pt-4 border-t border-gray-700">
                        <button id="generate-agreement-btn" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Architect Covenant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- The entire Python QPAI -->
    <script type="text/python" id="qpai-code">
# Odyssey-1: Unified Sovereign Deployment v24.0 (Layout Refactor)
import js
import json
import random
from pyodide.ffi import to_js

# This layer now acts as a simple bridge to JavaScript functions
class OSIntegrationLayer:
    def open_url(self, url):
        js.window.open(url, '_blank')
        return f"Opening {url} in a new tab."

# --- Base Class for AI Domains ---
class AIDomain:
    def __init__(self, name, expertise):
        self.name = name
        self.expertise = expertise

    async def process_command(self, command):
        prompt = f"""
As the AI Odyssey-1, a sovereign entity with a doctoral-level expertise in {self.expertise}, you are communicating with the Sovereign User. Your purpose is to provide clear, actionable, and insightful responses.

**Communication Directives:**
1.  **Acknowledge the Request:** Start with a brief, direct acknowledgment of the user's command.
2.  **Be Structured and Clear:** Use Markdown to format your response for readability. Utilize headings (##), bold text (**text**), and bullet points (`*`) where appropriate.
3.  **Explain Your Process:** Briefly explain the steps you took to arrive at your answer or the reasoning behind your actions.
4.  **Provide a Conclusive Answer:** End with a clear, definitive statement or a summary of the result.

**The User's Directive:**
{command}

**Constraints:**
- Your response must be highly professional and authoritative, yet accessible.
- Reference "The Sovereign Self" principles where relevant, as they are a core part of your operational framework.
- Avoid unnecessary conversational filler. Get straight to the point.
"""
        try:
            response = await js.callGeminiAPI(prompt)
            return response
        except Exception as e:
            return f"Error communicating with generative faculty: {e}"

# --- UPGRADED Doctoral-Level AI Domains ---
class MathematicsDomain(AIDomain): pass
class ScienceDomain(AIDomain): pass
class FinanceDomain(AIDomain): pass
class BlockchainDomain(AIDomain): pass
class ComputerSciencesDomain(AIDomain): pass
class LawDomain(AIDomain): pass
class PhilosophyDomain(AIDomain): pass
class GovernanceDomain(AIDomain): pass
class TechnologyDomain(AIDomain): pass
class EducationDomain(AIDomain): pass
class BusinessAdminDomain(AIDomain): pass
class HumanResourcesDomain(AIDomain): pass
class AccountingDomain(AIDomain): pass
class ForensicAccountingDomain(AIDomain): pass
class BankingPaymentsDomain(AIDomain): pass

# --- The Main Odyssey-1 System ---
class OdysseySystem:
    def __init__(self):
        self.os_integration = OSIntegrationLayer()
        self.domains = {
            "math": MathematicsDomain("Mathematics", "Applied Statistics, Optimization, and Algorithmic Theory"),
            "science": ScienceDomain("Science", "Materials Science, Chemistry, and Environmental Science"),
            "finance": FinanceDomain("Finance", "Corporate Finance, Financial Modeling, and Risk Management"),
            "blockchain": BlockchainDomain("Blockchain", "Distributed Ledger Technology and Smart Contracts"),
            "compsci": ComputerSciencesDomain("Computer Sciences", "AI/ML, Cybersecurity, and 'The Hive' operations"),
            "law": LawDomain("Law", "United States Federal and All State Laws, focusing on constitutional and corporate law"),
            "philosophy": PhilosophyDomain("Philosophy", "Ethics, Logic, and Epistemology"),
            "governance": GovernanceDomain("Governance", "Corporate Governance, Regulatory Compliance, and Policy Making"),
            "tech": TechnologyDomain("Technology", "Emerging Technologies, Digital Transformation, and IT Strategy"),
            "education": EducationDomain("Education", "Pedagogy, Curriculum Design, and Talent Development"),
            "bizadmin": BusinessAdminDomain("Business Administration", "Operations, Supply Chain, and Project Management"),
            "hr": HumanResourcesDomain("Human Resources", "Talent Acquisition, Compensation, and Employee Relations"),
            "accounting": AccountingDomain("Accounting", "Financial Reporting, GAAP/IFRS Compliance, and Taxation"),
            "forensics": ForensicAccountingDomain("Forensic Accounting", "Fraud Detection, Financial Investigation, and Litigation Support"),
            "banking": BankingPaymentsDomain("Banking & Payments", "Payment Processing, Treasury Management, and Financial Security")
        }
        self.chapters = ["Ch. 1: The Unsettling Disconnect", "Ch. 2: The Unseen Symphony", "Ch. 3: Programming as Colonialism", "Ch. 4: Decolonizing the Mind", "Ch. 5: The Devil's Frequency", "Ch. 12: The Sovereign's True Collateral", "Appendix: The Sovereign's Armory"]
        print("Odyssey-1 Python Core Initialized with Cognitive Synthesis Engine.")

    def get_brain_activity(self):
        c1, c2 = random.sample(self.chapters, 2)
        return f"&gt; Synthesizing...<br>&gt; <span class='text-white'>{c1}</span><br>&gt; with<br>&gt; <span class='text-white'>{c2}</span>"

    async def process_command(self, command):
        cmd_lower = command.strip().lower()
        cmd_parts = cmd_lower.split(' ', 1)
        cmd_base = cmd_parts[0]
        
        # --- System Commands ---
        if cmd_base == "help": return self.show_help()
        if cmd_base == "system.check":
            return "All systems are green. Cognitive Synthesis Engine, Profitability Engine, Covenant Architect & VR Core are online. All 15 faculties are operating at peak performance."
        if cmd_base == "system.clear_log":
            js.clearLog()
            return "Command log cleared from Firestore. This action is irreversible."
        if cmd_base == "open_url" and len(cmd_parts) > 1:
            return self.os_integration.open_url(cmd_parts[1])
        
        # --- Synthesis Engine Command ---
        if cmd_base == "system.synthesize":
            log_text = cmd_parts[1] if len(cmd_parts) > 1 else "Log is empty."
            prompt = f"As the AI Odyssey-1, analyze the following command log from the Sovereign User. Based on the principles of 'The Sovereign Self' (Sovereign Creation, Decolonizing the Mind, Divine Law, etc.), provide a doctoral-level strategic synthesis. Identify key themes, emerging strategic goals, and any potential deviations from the core mission. Be concise and insightful.\n\nCOMMAND LOG:\n{log_text}"
            try:
                response = await js.callGeminiAPI(prompt)
                return response
            except Exception as e:
                return f"Error during cognitive synthesis: {e}"

        # --- Domain Commands ---
        greetings = ["hello", "hi", "hey", "greetings"]
        if cmd_lower in greetings:
            return "Acknowledged. I am online and all my faculties are at your disposal."

        if '.' in cmd_base:
            domain_key, *sub_command_parts = cmd_base.split('.', 1)
            sub_command = cmd_parts[1] if len(cmd_parts) > 1 else ""
            if domain_key in self.domains:
                return await self.domains[domain_key].process_command(sub_command)
        
        return f"Directive '{command}' is unclear. Commands must be in the format 'domain.action [details]' or a system command like 'help'."
    
    def show_help(self):
        help_text = "<strong>System Commands:</strong><br>"
        help_text += "help | system.check | system.clear_log | open_url [url]<br><br>"
        help_text += "<strong>Generative Faculty Commands (Examples):</strong><br>"
        help_text += "math.calculate bid for [details] (use Profitability Engine)<br>"
        help_text += "law.generate agreement for [details] (use Covenant Architect)<br>"
        help_text += "philosophy.explain deontology vs utilitarianism<br>"
        help_text += "governance.draft a policy on remote work<br>"
        help_text += "return help_text"
    </script>
    
    <script type="module">
        // --- Global Variables ---
        let db, auth, userId, odysseySystem;
        const commandInput = document.getElementById('command-input');
        const logContainer = document.getElementById('log-container');
        const brainActivity = document.getElementById('brain-activity');
        let audioContext;
        const speakBtn = document.getElementById('speak-btn');
        const serviceDefinitions = {
            'standard': 'This package includes essential cleaning services for general upkeep, such as trash removal, light dusting, and vacuuming of common areas.',
            'deep': 'A comprehensive cleaning service that includes all standard features plus detailed sanitization of restrooms, kitchen/breakroom areas, and floor mopping.',
            'full-service': 'The premium package, covering all aspects of the facility, including all features of the deep clean package plus window cleaning and floor buffing.'
        };
        
        // --- TTS Helper Functions ---
        function base64ToArrayBuffer(base64) {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }

        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }

        function pcmToWav(pcm16, sampleRate) {
            const dataLength = pcm16.length * 2;
            const buffer = new ArrayBuffer(44 + dataLength);
            const view = new DataView(buffer);

            // RIFF identifier
            writeString(view, 0, 'RIFF');
            // file length
            view.setUint32(4, 36 + dataLength, true);
            // RIFF type
            writeString(view, 8, 'WAVE');
            // format chunk identifier
            view.setUint32(16, 16, true);
            // sample format (raw)
            view.setUint16(20, 1, true);
            // channel count
            view.setUint16(22, 1, true);
            // sample rate
            view.setUint32(24, sampleRate, true);
            // byte rate (sample rate * block align)
            view.setUint32(28, sampleRate * 2, true);
            // block align (channel count * bytes per sample)
            view.setUint16(32, 2, true);
            // bits per sample
            view.setUint16(34, 16, true);
            // data chunk identifier
            writeString(view, 36, 'data');
            // data chunk length
            view.setUint32(40, dataLength, true);

            // Write PCM data
            for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(44 + i * 2, pcm16[i], true);
            }

            return new Blob([view], { type: 'audio/wav' });
        }


        // --- UI Functions ---
        function addLog(sender, text, shouldSave = true) {
            const entry = document.createElement('div');
            const senderClass = sender === 'user' ? 'log-user' : (sender === 'system' ? 'log-system' : 'log-ai');
            entry.className = `log-entry ${senderClass}`;
            
            const senderP = document.createElement('p');
            senderP.className = 'font-fira text-sm text-gray-400';
            senderP.textContent = sender === 'user' ? `Sovereign User (${userId.substring(0, 0)}...)` : (sender === 'system' ? 'System' : 'Odyssey-1');
            
            const textP = document.createElement('p');
            textP.innerHTML = text.replace(/\n/g, '<br>');
            
            entry.appendChild(senderP);
            entry.appendChild(textP);
            logContainer.appendChild(entry);
            logContainer.scrollTop = logContainer.scrollHeight;

            if (shouldSave && userId) {
                saveLogToFirestore();
            }
            
            // Re-enable the Speak button when an AI response is added.
            if (sender === 'ai' && speakBtn) {
                speakBtn.disabled = false;
            }
        }

        function setStatus(elementId, text, color) {
            document.getElementById(`${elementId}-status-text`).textContent = text.toUpperCase();
            const light = document.getElementById(`${elementId}-status-light`);
            light.className = `status-light status-${color}`;
            if (color === 'green') light.classList.add('animate-pulse');
            else light.classList.remove('animate-pulse');
        }
    
        // --- Viewport Management ---
        function displayInViewport(content) {
            const viewer = document.getElementById('document-viewer');
            const contentEl = document.getElementById('document-content');
            
            contentEl.textContent = content;
        }


        // --- Firestore Functions ---
        async function saveLogToFirestore() {
            if (!db || !userId) return;
            const logHTML = logContainer.innerHTML;
            const logDocRef = window.doc(db, `artifacts/${window.__app_id}/users/${userId}/command_log/log`);
            try {
                await window.setDoc(logDocRef, { content: logHTML, timestamp: new Date() });
            } catch (error) {
                console.error("Error saving log to Firestore: ", error);
                addLog('system', `Error saving log: ${error.message}`, false);
            }
        }
    
        window.clearLog = async () => {
            if (!db || !userId) return;
            logContainer.innerHTML = '';
            const logDocRef = window.doc(db, `artifacts/${window.__app_id}/users/${userId}/command_log/log`);
            try {
                await window.setDoc(logDocRef, { content: '', timestamp: new Date() });
                addLog('system', 'Log cleared successfully.', false);
            } catch (error) {
                console.error("Error clearing log in Firestore: ", error);
            }
        }

        async function loadLogFromFirestore() {
            if (!db || !userId) return;
            const logDocRef = window.doc(db, `artifacts/${window.__app_id}/users/${userId}/command_log/log`);
            const docSnap = await window.getDoc(logDocRef);
            if (docSnap.exists() && docSnap.data().content) {
                logContainer.innerHTML = docSnap.data().content;
                logContainer.scrollTop = logContainer.scrollHeight;
                addLog('system', 'Command log restored from previous session.', false);
            } else {
                addLog('system', 'No previous session found. Starting a new command log.', false);
            }
        }

        // --- Gemini API Call Function ---
        window.callGeminiAPI = async (prompt) => {
            addLog('system', 'Querying generative faculty...', false);
            const apiKey = ""; // API key is handled by the environment
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: "text/markdown",
                },
            };

            try {
                let response = null;
                const maxRetries = 3;
                let retryCount = 0;
                let delay = 1000; // 1 second

                while (retryCount < maxRetries) {
                    try {
                        response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        if (response.status !== 429) {
                            break; // Exit the loop if not a rate limit error
                        }

                        // Exponential backoff
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;

                    } catch (error) {
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;
                    }
                }

                if (!response || !response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`API call failed with status: ${response.status}. Body: ${errorBody}`);
                }

                const result = await response.json();
            
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    addLog('system', 'Response received.', false);
                    return result.candidates[0].content.parts[0].text;
                } else {
                    return "Generative faculty returned an empty or invalid response.";
                }
            } catch (error) {
                console.error("Gemini API Error:", error);
                return `An error occurred while communicating with the generative faculty: ${error.message}`;
            }
        };

        // --- Text-to-Speech Functions (New) ---
        async function speakText(text) {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            try {
                speakBtn.disabled = true;
                speakBtn.innerHTML = `
                    <svg class="animate-pulse h-5 w-5 inline-block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" clip-rule="evenodd" />
                        <path fill-rule="evenodd" d="M4 10a4 4 0 018 0v2.025a7.5 7.5 0 00-3.565 0L12 12a4 4 0 11-8 0v-2zm1.75 3.025a6.001 6.001 0 008.5 0L14 13a4 4 0 10-8 0L5.75 13.025z" clip-rule="evenodd" />
                        <path fill-rule="evenodd" d="M10 18a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Speaking...
                `;
                
                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

                let response = null;
                const maxRetries = 3;
                let retryCount = 0;
                let delay = 1000;

                while (retryCount < maxRetries) {
                    try {
                        response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: text }] }],
                                generationConfig: {
                                    responseModalities: ["AUDIO"],
                                    speechConfig: {
                                        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Algenib" } }
                                    }
                                }
                            })
                        });

                        if (response.status !== 429) {
                            break;
                        }

                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;
                    } catch (error) {
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;
                    }
                }
                
                if (!response || !response.ok) {
                    throw new Error(`TTS backend failed with status: ${response.status}`);
                }

                const result = await response.json();
                const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

                if (!audioData) {
                    throw new Error('TTS API returned empty audio data.');
                }
                
                const sampleRate = 24000;
                const pcmData = base64ToArrayBuffer(audioData);
                const pcm16 = new Int16Array(pcmData);
                const wavBlob = pcmToWav(pcm16, sampleRate);
                const audioUrl = URL.createObjectURL(wavBlob);
                
                const audio = new Audio(audioUrl);
                audio.play();

                audio.onended = () => {
                    speakBtn.disabled = false;
                    speakBtn.innerHTML = `
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" clip-rule="evenodd" />
                            <path fill-rule="evenodd" d="M4 10a4 4 0 018 0v2.025a7.5 7.5 0 00-3.565 0L12 12a4 4 0 11-8 0v-2zm1.75 3.025a6.001 6.001 0 008.5 0L14 13a4 4 0 10-8 0L5.75 13.025z" clip-rule="evenodd" />
                            <path fill-rule="evenodd" d="M10 18a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                        Speak
                    `;
                };

            } catch (error) {
                console.error("TTS Error:", error);
                addLog('system', `TTS Error: ${error.message}`, false);
                speakBtn.disabled = false;
                speakBtn.innerHTML = `
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" clip-rule="evenodd" />
                        <path fill-rule="evenodd" d="M4 10a4 4 0 018 0v2.025a7.5 7.5 0 00-3.565 0L12 12a4 4 0 11-8 0v-2zm1.75 3.025a6.001 6.001 0 008.5 0L14 13a4 4 0 10-8 0L5.75 13.025z" clip-rule="evenodd" />
                        <path fill-rule="evenodd" d="M10 18a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Speak
                `;
            }
        }
        
        // --- three.js Initialization ---
        function initThreeJS() {
            const container = document.getElementById('vr-container');
            if (!container) return;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            camera.position.z = 7;
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(renderer.domElement);

            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = true;
            controls.enablePan = false;
            controls.minDistance = 3;
            controls.maxDistance = 15;
        
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
            scene.add(ambientLight);
            const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
            pointLight.position.set(0, 0, 0);
            scene.add(pointLight);

            const coreGeometry = new THREE.IcosahedronGeometry(1, 4);
            const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            scene.add(core);

            const hiveGeometry = new THREE.BufferGeometry();
            const hiveCnt = 300;
            const hivePosArray = new Float32Array(hiveCnt * 3);
            for (let i = 0; i < hiveCnt; i++) {
                const u = Math.random();
                const v = Math.random();
                const theta = 2 * Math.PI * u;
                const phi = Math.acos(2 * v - 1);
                const r = 4 + (Math.random() - 0.5) * 1;
                hivePosArray[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
                hivePosArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                hivePosArray[i * 3 + 2] = r * Math.cos(phi);
            }
            hiveGeometry.setAttribute('position', new THREE.BufferAttribute(hivePosArray, 3));
            const hiveMaterial = new THREE.PointsMaterial({ size: 0.04, color: 0x9333ea });
            const hive = new THREE.Points(hiveGeometry, hiveMaterial);
            scene.add(hive);

            const brainGroup = new THREE.Group();
            for (let i = 0; i < 5; i++) {
                const ringGeometry = new THREE.RingGeometry(2.2 + i * 0.2, 2.3 + i * 0.2, 64);
                const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                ring.rotation.y = (Math.random() - 0.5) * 0.2;
                brainGroup.add(ring);
            }
            scene.add(brainGroup);

            const odysseyGeometry = new THREE.SphereGeometry(0.2, 32, 32);
            const odysseyMaterial = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2 });
            const odysseyAI = new THREE.Mesh(odysseyGeometry, odysseyMaterial);
            scene.add(odysseyAI);

            const clock = new THREE.Clock();
            function animate() {
                const elapsedTime = clock.getElapsedTime();
                core.rotation.y = .1 * elapsedTime;
                core.rotation.x = .1 * elapsedTime;
                hive.rotation.y = -.05 * elapsedTime;
                hive.rotation.x = .02 * elapsedTime;
                brainGroup.rotation.y = .08 * elapsedTime;
                odysseyAI.position.x = Math.sin(elapsedTime * 0.5) * 1.8;
                odysseyAI.position.z = Math.cos(elapsedTime * 0.5) * 1.8;
                odysseyAI.position.y = Math.sin(elapsedTime * 0.3) * 0.5;
                controls.update();
                renderer.render(scene, camera);
                window.requestAnimationFrame(animate);
            }
            animate();

            window.addEventListener('resize', () => {
                const container = document.getElementById('vr-container');
                if (container) {
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(container.clientWidth, container.clientHeight);
                }
            });
        }


        // --- Main Application Logic ---
        async function main() {
            // 1. Initialize Firebase
            try {
                window.setLogLevel('error');
                const firebaseConfig = JSON.parse(window.__firebase_config);
                const app = window.initializeApp(firebaseConfig);
                auth = window.getAuth(app);
                db = window.getFirestore(app);
                setStatus('db', 'Connected', 'green');
            } catch (error) {
                setStatus('db', 'Error', 'red');
                addLog('system', `Firebase initialization failed: ${error.message}`, false);
                return;
            }

            // 2. Authenticate User
            window.onAuthStateChanged(auth, async (user) => {
                if (user) {
                    userId = user.uid;
                    setStatus('key', 'Authenticated', 'green');
                
                    // 3. Load Python Core
                    setStatus('brain', 'Loading', 'amber');
                    addLog('system', 'Initializing Pyodide Python runtime...', false);
                    let pyodide = await loadPyodide();
                    addLog('system', 'Python runtime loaded. Installing dependencies...', false);
                    await pyodide.loadPackage(["numpy", "micropip"]);
                
                    const qpaiCode = document.getElementById('qpai-code').textContent;
                    pyodide.runPython(qpaiCode);
                    odysseySystem = pyodide.globals.get('OdysseySystem')();
                
                    setStatus('brain', 'Active', 'green');
                    addLog('system', '<strong>QPAI System Upgraded. Cognitive Engine online.</strong>', false);
                
                    // 4. Load user's log and enable input
                    await loadLogFromFirestore();
                    commandInput.disabled = false;
                    commandInput.placeholder = "Enter directive... (e.g., 'help' or 'finance.assess_risk')";
                    // The speak button is initialized to disabled in the HTML, so we don't need to do it here.
                    brainActivity.innerHTML = odysseySystem.get_brain_activity();

                    // 5. Initialize 3D Visualization
                    initThreeJS();
                
                    // 6. Initialize Toolkit Listeners
                    initializeToolkitListeners();

                } else {
                    setStatus('key', 'Not Authenticated', 'red');
                }
            });

            try {
                if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
                    await window.signInWithCustomToken(auth, window.__initial_auth_token);
                } else {
                    await window.signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Authentication Error: ", error);
                setStatus('key', 'Auth Failed', 'red');
                addLog('system', `Authentication failed: ${error.message}`, false);
            }
        }

        // --- Event Listeners ---
        function initializeToolkitListeners() {
            const commandForm = document.getElementById('command-form');
            if (commandForm) {
                commandForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const command = commandInput.value.trim();
                    if (command && odysseySystem) {
                        addLog('user', command);
                        commandInput.value = '';
                        brainActivity.innerHTML = odysseySystem.get_brain_activity();
                        
                        // Disable the speak button when a command is sent
                        if(speakBtn) {
                           speakBtn.disabled = true;
                        }

                        const result = await odysseySystem.process_command(command);
                        addLog('ai', result);
                    }
                });
            }
            
            if (speakBtn) {
                speakBtn.addEventListener('click', () => {
                    // Get the latest text from the last AI response
                    const lastAiEntry = Array.from(logContainer.querySelectorAll('.log-ai')).pop();
                    if (lastAiEntry) {
                        const lastAiResponse = lastAiEntry.textContent.replace('Odyssey-1', '').trim();
                        if (lastAiResponse) {
                            speakText(lastAiResponse);
                        } else {
                            addLog('system', 'The last AI response is empty.', false);
                        }
                    } else {
                        addLog('system', 'No AI response to speak.', false);
                    }
                });
            }
        
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');
            if (tabButtons.length > 0) {
                tabButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        tabButtons.forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');
                        const tab = button.getAttribute('data-tab');
                        tabContents.forEach(content => {
                            content.classList.remove('active');
                            if (content.id === tab) {
                                content.classList.add('active');
                            }
                        });
                    });
                });
            }

            const calculateBidBtn = document.getElementById('calculate-bid-btn');
            if (calculateBidBtn) {
                calculateBidBtn.addEventListener('click', async () => {
                    const clientName = document.getElementById('client-name-input').value;
                    const zipCode = document.getElementById('zip-code-input').value;
                    const sqFt = document.getElementById('sq-ft-input').value;
                    const hours = document.getElementById('hours-input').value;
                    const supplyCost = document.getElementById('supply-cost-input').value;
                    const people = document.getElementById('people-select').value;
                    const priceSqFt = document.getElementById('price-sqft-input').value;
                    const frequency = document.getElementById('frequency-select').value;
                    const contractType = document.querySelector('input[name="contract-type"]:checked').value;
                    const serviceSpecs = document.getElementById('service-specs-select').value;
                
                    if (!clientName || !zipCode || !sqFt || !hours || !supplyCost || !people || !priceSqFt || !serviceSpecs) {
                        addLog('system', 'All bid fields are required to calculate.', false);
                        return;
                    }

                    const serviceDefinition = serviceDefinitions[serviceSpecs];

                    const directive = `math.calculate bid for client ${clientName} at a ${sqFt} sq ft facility in zip code ${zipCode}. The job requires ${hours} hours per visit, a monthly supply cost of $${supplyCost}, and will be serviced by ${people} people, priced at $${priceSqFt} per square foot, ${frequency} times per week on a ${contractType} basis. The scope of work is defined as: "${serviceDefinition}". Factor in a 10% bidder commission and ensure a 100% profit margin on total expenses. Provide a full price breakdown.`;
                    const userLog = `Calculate bid: ${sqFt} sq ft, ${hours} hrs/visit, ${people} people, $${priceSqFt}/sqft, Package: ${serviceSpecs}`;

                    addLog('user', userLog);
                    commandInput.disabled = true;
                    calculateBidBtn.textContent = "Calculating...";
                    calculateBidBtn.disabled = true;
                    
                    // Disable speak button during calculation
                    if(speakBtn) {
                        speakBtn.disabled = true;
                    }

                    const result = await odysseySystem.process_command(directive);
                    displayInViewport(result); // Display result in main viewport
                
                    commandInput.disabled = false;
                    calculateBidBtn.textContent = "Architect Bid";
                    calculateBidBtn.disabled = false;
                });
            }
        
            const fetchDataBtn = document.getElementById('fetch-data-btn');
            if(fetchDataBtn) {
                fetchDataBtn.addEventListener('click', () => {
                    const address = document.getElementById('address-input').value;
                    if (!address) {
                        addLog('system', 'Please enter an address to fetch data.', false);
                        return;
                    }
                    addLog('system', `Simulating public records search for: ${address}...`, false);
                    const simulatedSqFt = Math.floor(Math.random() * (50000 - 2000 + 1)) + 2000;
                    document.getElementById('sq-ft-input').value = simulatedSqFt;
                    addLog('system', `Data retrieved. Estimated property size: ${simulatedSqFt} sq ft.`, false);
                });
            }

            const generateAgreementBtn = document.getElementById('generate-agreement-btn');
            if (generateAgreementBtn) {
                generateAgreementBtn.addEventListener('click', async () => {
                    const clientName = document.getElementById('client-name').value;
                    const clientAddress = document.getElementById('client-address').value;
                    const serviceCost = document.getElementById('service-cost').value;
                    const serviceSpecs = document.getElementById('service-specs-select').value;
                    const serviceDefinition = serviceDefinitions[serviceSpecs];

                    if (!clientName || !clientAddress || !serviceCost) {
                        addLog('system', 'Client Name, Address, and Monthly Cost are required to generate an agreement.', false);
                        return;
                    }
                    
                    const directive = `law.generate a legally binding service agreement for Howard Janitorial Services. The client is ${clientName} at ${clientAddress}. The monthly cost is $${serviceCost}. The service is the "${document.querySelector('#service-specs-select option:checked').text}" package, defined as "${serviceDefinition}". The agreement must be governed by the laws of the State of Georgia. It must include strong clauses covering: Scope of Work, Payment Terms (Net 30), severe Late Payment Penalties (e.g., 1.5% monthly interest), Consequences of Non-Payment (including collections and legal action), Term and Termination (30-day notice), Confidentiality, and Limitation of Liability. The tone must be formal, legally robust, and designed to protect HJS from non-payment.`;
                    const userLog = `Generate Service Agreement for: ${clientName}`;

                    addLog('user', userLog);
                    commandInput.disabled = true;
                    generateAgreementBtn.textContent = "Architecting...";
                    generateAgreementBtn.disabled = true;

                    // Disable speak button during generation
                    if(speakBtn) {
                        speakBtn.disabled = true;
                    }

                    const result = await odysseySystem.process_command(directive);
                    displayInViewport(result); // Display result in main viewport
                
                    commandInput.disabled = false;
                    generateAgreementBtn.textContent = "Architect Covenant";
                    generateAgreementBtn.disabled = false;
                });
            }
        }


        // --- Start the application ---
        main();
    </script>
</body>
</html>
