export interface CourseOutcome {
  co_code: string;
  statement: string;
  blooms_level: 'L1: Remember' | 'L2: Understand' | 'L3: Apply' | 'L4: Analyze' | 'L5: Evaluate' | 'L6: Create';
  blooms_numeric: number;
  mapped_pos: Record<string, number>; // PO1..PO12 -> correlation weight (1: Low, 2: Medium, 3: High)
  target_attainment_pct: number;
  achieved_attainment_pct: number;
}

export interface DepartmentCourse {
  course_code: string;
  title: string;
  department: string;
  department_code: string;
  semester: number;
  credit_weight: number;
  lecture_hours_per_week: number;
  lab_hours_per_week: number;
  enrolled_count: number;
  assigned_faculty_id: string;
  assigned_faculty_name: string;
  course_outcomes: CourseOutcome[];
}

export interface ClassroomFacility {
  room_id: string;
  building: string;
  room_type: 'Lecture Hall' | 'Laboratory' | 'Seminar Room' | 'Examination Auditorium';
  capacity: number;
  exam_bench_capacity: number;
  department_allocation: string;
  has_smart_podium: boolean;
}

export interface DepartmentMetadata {
  department_id: string;
  department_code: string;
  department_name: string;
  school_block: string;
  hod_faculty_id: string;
  hod_name: string;
  total_faculty: number;
  total_students: number;
  total_credits_required: number;
  classrooms: ClassroomFacility[];
  courses: DepartmentCourse[];
}

export interface FacultyRecord {
  faculty_id: string;
  name: string;
  department: string;
  department_code: string;
  academic_title: 'Professor' | 'Associate Professor' | 'Assistant Professor';
  specialized_research_domain: string;
  email: string;
  office_hours: string;
  office_room: string;
  assigned_courses: string[];
  assigned_course_titles: string[];
  publications_count: number;
  max_weekly_teaching_hours: number;
}

export interface StudentRecord {
  student_id: string;
  full_name: string;
  department: string;
  department_code: string;
  current_semester: number;
  cgpa: number;
  attendance_percentage: number;
  risk_status: boolean; // true if attendance_percentage < 75 or cgpa < 6.0
  fee_payment_status: 'Paid' | 'Pending' | 'Overdue' | 'Scholarship Hold';
  continuous_eval_score: number;
  assignment_completion_rate: number;
  email: string;
  advisor_faculty_id: string;
  backlogs_count: number;
}

export interface OmniERPDatabase {
  schema_version: string;
  generated_at: string;
  institution: string;
  summary: {
    total_departments: number;
    total_faculty: number;
    total_students: number;
    total_courses: number;
    total_classrooms: number;
  };
  departments: DepartmentMetadata[];
  faculty: FacultyRecord[];
  students: StudentRecord[];
}

export const DEPARTMENT_SPECS: Array<{
  code: string;
  name: string;
  block: string;
  domains: string[];
  courses: Array<{ sem: number; code: string; title: string; credits: number; lab: number }>;
}> = [
  {
    code: 'CSE',
    name: 'Computer Science & Engineering',
    block: 'Turing Academic Complex, Block A',
    domains: [
      'Distributed Systems & Cloud Consensus',
      'Compiler Design & Program Verification',
      'Deep Learning & Computer Vision',
      'Zero-Knowledge Cryptography & Systems Security',
      'Database Internals & Query Optimization',
      'Natural Language Processing & Information Retrieval',
      'Operating Systems Kernel Architecture',
      'Graph Algorithms & Combinatorial Optimization',
      'High-Performance Computing & GPU Kernels',
      'Edge Computing & Cyber-Physical Networks',
    ],
    courses: [
      { sem: 1, code: 'CSE101', title: 'Algorithmic Problem Solving & C', credits: 4, lab: 2 },
      { sem: 3, code: 'CSE301', title: 'Data Structures & Graph Algorithms', credits: 4, lab: 2 },
      { sem: 4, code: 'CSE402', title: 'Operating Systems & Kernel Internals', credits: 4, lab: 2 },
      { sem: 5, code: 'CSE501', title: 'Relational & Distributed Database Systems', credits: 4, lab: 2 },
      { sem: 6, code: 'CSE603', title: 'Compiler Design & Formal Languages', credits: 4, lab: 0 },
      { sem: 7, code: 'CSE701', title: 'Statistical Machine Learning & Neural Architectures', credits: 4, lab: 2 },
      { sem: 7, code: 'CSE704', title: 'Cloud Native Distributed Systems', credits: 3, lab: 2 },
      { sem: 8, code: 'CSE801', title: 'Cryptographic Protocols & Network Defense', credits: 3, lab: 0 },
    ],
  },
  {
    code: 'ECE',
    name: 'Electronics & Communication',
    block: 'Shannon Hall, Block B',
    domains: [
      'VLSI Design & Sub-Nanometer CMOS',
      'Millimeter-Wave 6G Antenna Arrays',
      'Embedded Real-Time Signal Processing',
      'Photonics & Optical Fiber Interconnects',
      'RF Integrated Circuits & Transceivers',
      'MEMS Sensors & Nanoelectronics',
      'Wireless Information Theory & Coding',
      'System-on-Chip (SoC) Verification',
      'Radar Systems & Adaptive Beamforming',
      'Biomedical Instrumentation & Telemetry',
    ],
    courses: [
      { sem: 2, code: 'ECE201', title: 'Analog Electronic Circuits', credits: 4, lab: 2 },
      { sem: 3, code: 'ECE302', title: 'Signals, Systems & Fourier Analysis', credits: 4, lab: 0 },
      { sem: 4, code: 'ECE401', title: 'Electromagnetic Field Theory & Transmission Lines', credits: 4, lab: 0 },
      { sem: 5, code: 'ECE503', title: 'Digital Signal Processing & Filter Design', credits: 4, lab: 2 },
      { sem: 6, code: 'ECE601', title: 'CMOS VLSI Design & Physical Verification', credits: 4, lab: 2 },
      { sem: 7, code: 'ECE702', title: 'Wireless Cellular & 5G/6G Communication', credits: 3, lab: 2 },
    ],
  },
  {
    code: 'MECH',
    name: 'Mechanical Engineering',
    block: 'Carnot Engineering Wing, Block C',
    domains: [
      'Computational Fluid Dynamics & Turbulence',
      'Additive Manufacturing & Metallurgy',
      'Robotics Kinematics & Mechatronic Control',
      'Finite Element Structural Mechanics',
      'Thermal Energy Storage & Heat Exchangers',
      'Tribology & Surface Engineering',
      'Autonomous Vehicle Dynamics & Powertrain',
      'Composite Materials & Fracture Mechanics',
      'Cryogenic Propulsion Systems',
      'Micro-Scale Heat Transfer',
    ],
    courses: [
      { sem: 2, code: 'MECH201', title: 'Engineering Thermodynamics', credits: 4, lab: 0 },
      { sem: 3, code: 'MECH301', title: 'Fluid Mechanics & Hydraulic Machines', credits: 4, lab: 2 },
      { sem: 4, code: 'MECH402', title: 'Kinematics & Dynamics of Machinery', credits: 4, lab: 2 },
      { sem: 5, code: 'MECH501', title: 'Heat & Mass Transfer Operations', credits: 4, lab: 2 },
      { sem: 6, code: 'MECH602', title: 'Finite Element Analysis in Solid Mechanics', credits: 4, lab: 2 },
      { sem: 7, code: 'MECH701', title: 'Industrial Robotics & Mechatronics', credits: 3, lab: 2 },
    ],
  },
  {
    code: 'CIVIL',
    name: 'Civil Engineering',
    block: 'Visvesvaraya Infrastructure Hall, Block D',
    domains: [
      'Earthquake-Resistant Structural Dynamics',
      'Geotechnical Foundation & Slope Stability',
      'Urban Transportation Network Modeling',
      'Hydrological Basin & Floodplain Simulation',
      'Sustainable Prestressed Concrete Materials',
      'Environmental Wastewater Bioremediation',
      'Remote Sensing & GIS Geomatics',
      'Bridge Aerodynamics & Structural Health Monitoring',
      'Pavement Rheology & Bituminous Composites',
      'Coastal Hydraulics & Offshore Structures',
    ],
    courses: [
      { sem: 2, code: 'CIV201', title: 'Mechanics of Solids & Structural Statics', credits: 4, lab: 2 },
      { sem: 3, code: 'CIV302', title: 'Geotechnical Engineering & Soil Mechanics', credits: 4, lab: 2 },
      { sem: 4, code: 'CIV401', title: 'Design of Reinforced Concrete Structures', credits: 4, lab: 0 },
      { sem: 5, code: 'CIV502', title: 'Open Channel Hydraulics & Hydrology', credits: 4, lab: 2 },
      { sem: 6, code: 'CIV601', title: 'Seismic Analysis & Steel Structure Design', credits: 4, lab: 0 },
      { sem: 7, code: 'CIV703', title: 'Transportation Systems & Urban Traffic Engineering', credits: 3, lab: 2 },
    ],
  },
  {
    code: 'BIOTECH',
    name: 'Biotechnology',
    block: 'Rosalind Franklin Life Sciences Center',
    domains: [
      'CRISPR-Cas9 Genome Editing & Therapeutics',
      'Bioprocess Fermentation & Downstream Purification',
      'Structural Bioinformatics & Protein Folding',
      'Synthetic Biology & Metabolic Engineering',
      'Cancer Immunotherapy & Monoclonal Antibodies',
      'Nanobiotechnology & Targeted Drug Delivery',
      'Plant Molecular Genetics & Stress Tolerance',
      'Microbial Metagenomics & Microbiome Systems',
      'Stem Cell Tissue Scaffolding',
      'Enzymology & Biocatalysis Kinetics',
    ],
    courses: [
      { sem: 2, code: 'BIO201', title: 'Biochemistry & Biomolecular Structure', credits: 4, lab: 2 },
      { sem: 3, code: 'BIO301', title: 'Molecular Biology & Recombinant DNA', credits: 4, lab: 2 },
      { sem: 4, code: 'BIO402', title: 'Bioprocess Engineering & Bioreactor Design', credits: 4, lab: 2 },
      { sem: 5, code: 'BIO501', title: 'Computational Genomics & Bioinformatics', credits: 4, lab: 2 },
      { sem: 6, code: 'BIO602', title: 'Immunotechnology & Vaccine Engineering', credits: 4, lab: 2 },
      { sem: 7, code: 'BIO701', title: 'CRISPR Gene Editing & Synthetic Biology', credits: 3, lab: 2 },
    ],
  },
  {
    code: 'LAW',
    name: 'School of Law',
    block: 'Ambedkar Jurisprudence Chambers',
    domains: [
      'Constitutional Law & Comparative Federalism',
      'International Trade & WTO Dispute Resolution',
      'Intellectual Property & AI Patent Jurisprudence',
      'Corporate Governance & Mergers Regulation',
      'Environmental Treaties & Climate Litigation',
      'Cyber Law, Data Privacy & Digital Forensics',
      'Criminal Jurisprudence & Evidentiary Standards',
      'International Humanitarian & Maritime Law',
      'Competition Law & Antitrust Economics',
      'Alternative Dispute Resolution & International Arbitration',
    ],
    courses: [
      { sem: 1, code: 'LAW101', title: 'Jurisprudence & Constitutional Foundations', credits: 4, lab: 0 },
      { sem: 2, code: 'LAW202', title: 'Law of Contracts & Specific Relief', credits: 4, lab: 0 },
      { sem: 3, code: 'LAW301', title: 'Criminal Procedure & Law of Evidence', credits: 4, lab: 0 },
      { sem: 5, code: 'LAW501', title: 'Corporate Law & Securities Regulation', credits: 4, lab: 0 },
      { sem: 6, code: 'LAW602', title: 'Intellectual Property & Technology Law', credits: 4, lab: 0 },
      { sem: 7, code: 'LAW701', title: 'International Commercial Arbitration & Moot Court', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'SBM',
    name: 'School of Business Management',
    block: 'Global Executive Pavilion',
    domains: [
      'Quantitative Supply Chain & Operations Research',
      'Corporate Finance & Derivatives Pricing',
      'Strategic Management & Platform Ecosystems',
      'Organizational Behavior & Leadership Dynamics',
      'Consumer Neuroscience & Brand Equity',
      'Algorithmic FinTech & Risk Analytics',
      'Venture Capital & Entrepreneurial Finance',
      'International Macro-Trade Strategy',
      'People Analytics & Industrial Relations',
      'ESG Sustainability & Corporate Reporting',
    ],
    courses: [
      { sem: 1, code: 'SBM101', title: 'Microeconomics for Business Decision Making', credits: 4, lab: 0 },
      { sem: 2, code: 'SBM201', title: 'Corporate Financial Accounting & Control', credits: 4, lab: 0 },
      { sem: 3, code: 'SBM302', title: 'Operations Research & Supply Chain Optimization', credits: 4, lab: 2 },
      { sem: 5, code: 'SBM501', title: 'Quantitative Investment & Portfolio Management', credits: 4, lab: 0 },
      { sem: 6, code: 'SBM602', title: 'Strategic Marketing & Consumer Analytics', credits: 4, lab: 2 },
      { sem: 7, code: 'SBM701', title: 'Competitive Corporate Strategy & M&A', credits: 3, lab: 0 },
    ],
  },
  {
    code: 'ARCH',
    name: 'Architecture & Planning',
    block: 'Corbusier Design Studios',
    domains: [
      'Bioclimatic Passive Solar Architecture',
      'Parametric Computational Design & BIM',
      'Urban Transit-Oriented Master Planning',
      'Heritage Conservation & Vernacular Tectonics',
      'High-Rise Diagrid Structural Systems',
      'Landscape Ecology & Sponge City Design',
      'Architectural Acoustics & Daylighting Simulation',
      'Affordable Modular Housing Systems',
      'Spatial Syntax & Urban Morphology',
      'Net-Zero Embodied Carbon Materials',
    ],
    courses: [
      { sem: 1, code: 'ARC101', title: 'Architectural Representation & Tectonic Studio I', credits: 5, lab: 4 },
      { sem: 3, code: 'ARC301', title: 'Climatology & Vernacular Built Environments', credits: 4, lab: 2 },
      { sem: 4, code: 'ARC402', title: 'Building Information Modeling & Parametric Forms', credits: 4, lab: 2 },
      { sem: 5, code: 'ARC501', title: 'Urban Housing & Regional Planning Studio', credits: 5, lab: 4 },
      { sem: 6, code: 'ARC602', title: 'Long-Span Structures & Architectural Acoustics', credits: 4, lab: 0 },
      { sem: 7, code: 'ARC701', title: 'Sustainable Urbanism & Net-Zero Building Design', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'PHARMA',
    name: 'Pharmaceutical Sciences',
    block: 'Fleming Clinical Formulation Wing',
    domains: [
      'Computer-Aided Drug Design & Molecular Docking',
      'Pharmacokinetics & Clinical Bioavailability',
      'Liposomal & Nanoparticulate Drug Delivery',
      'Medicinal Chemistry of Heterocyclic Compounds',
      'Pharmacognosy & Phytochemical Standardization',
      'Neuropharmacology & Receptor Toxicology',
      'Regulatory Affairs & cGMP Quality Assurance',
      'Biopharmaceutics & Controlled Release Matrices',
      'Analytical HPLC-MS Method Validation',
      'Oncology Pharmacogenomics',
    ],
    courses: [
      { sem: 2, code: 'PHA201', title: 'Pharmaceutical Organic & Medicinal Chemistry I', credits: 4, lab: 2 },
      { sem: 3, code: 'PHA301', title: 'Physical Pharmaceutics & Colloidal Systems', credits: 4, lab: 2 },
      { sem: 4, code: 'PHA402', title: 'Pharmacology & Pathophysiology I', credits: 4, lab: 2 },
      { sem: 5, code: 'PHA501', title: 'Industrial Pharmacy & Dosage Form Design', credits: 4, lab: 2 },
      { sem: 6, code: 'PHA602', title: 'Biopharmaceutics & Clinical Pharmacokinetics', credits: 4, lab: 2 },
      { sem: 7, code: 'PHA701', title: 'Instrumental Pharmaceutical Analysis & Drug Design', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'ECON',
    name: 'Economics & Public Policy',
    block: 'Kautilya Policy & Econometrics Hall',
    domains: [
      'Causal Inference & Applied Microeconometrics',
      'Monetary Policy & Central Bank DSGE Modeling',
      'Development Economics & Poverty Alleviation RCTs',
      'Public Finance & Fiscal Federalism',
      'Environmental Carbon Pricing & Energy Policy',
      'Game Theory & Mechanism Design',
      'Labor Economics & Automation Technological Shift',
      'Health Economics & Universal Insurance Systems',
      'International Trade Tariffs & Global Value Chains',
      'Behavioral Economics & Public Nudge Architecture',
    ],
    courses: [
      { sem: 1, code: 'ECO101', title: 'Mathematical Foundations for Microeconomics', credits: 4, lab: 0 },
      { sem: 3, code: 'ECO301', title: 'Macroeconomic Theory & Monetary Institutions', credits: 4, lab: 0 },
      { sem: 4, code: 'ECO402', title: 'Cross-Section & Panel Data Econometrics', credits: 4, lab: 2 },
      { sem: 5, code: 'ECO501', title: 'Game Theory & Strategic Information Economics', credits: 4, lab: 0 },
      { sem: 6, code: 'ECO602', title: 'Public Finance, Taxation & Welfare Policy', credits: 4, lab: 0 },
      { sem: 7, code: 'ECO701', title: 'Causal Policy Evaluation & Development Economics', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'JMC',
    name: 'Journalism & Mass Communication',
    block: 'Fourth Estate Media Conservatory',
    domains: [
      'Data Journalism & Computational Fact-Checking',
      'Broadcast Documentary Production & Cinematography',
      'Media Law, Press Freedom & Digital Ethics',
      'Political Communication & Public Sphere Theory',
      'Investigative Reporting & Open-Source Intelligence',
      'Audio Storytelling & Podcast Sound Engineering',
      'Global Disinformation Networks & Media Literacy',
      'Cross-Platform Newsroom Workflow Systems',
      'Science & Environmental Risk Communication',
      'Visual Semiotics & Photojournalism',
    ],
    courses: [
      { sem: 1, code: 'JMC101', title: 'History & Theories of Mass Communication', credits: 4, lab: 0 },
      { sem: 3, code: 'JMC301', title: 'Investigative Journalism & Newsroom Reporting', credits: 4, lab: 2 },
      { sem: 4, code: 'JMC402', title: 'Broadcast Television & Documentary Production', credits: 4, lab: 2 },
      { sem: 5, code: 'JMC501', title: 'Data Journalism & Visual Information Design', credits: 4, lab: 2 },
      { sem: 6, code: 'JMC602', title: 'Media Jurisprudence, Ethics & Digital Rights', credits: 4, lab: 0 },
      { sem: 7, code: 'JMC701', title: 'Multimedia Capstone Newsroom & OSINT Verification', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'FAD',
    name: 'Fine Arts & Design',
    block: 'Bauhaus Creative Atelier',
    domains: [
      'Human-Computer Interaction & Design Systems',
      'Swiss Editorial Typography & Grid Systems',
      'Industrial Product Ergonomics & CMF Design',
      'Motion Graphics & Kinetic Identity Systems',
      'Contemporary Printmaking & Material Sculpture',
      'Sustainable Textile & Biomaterial Weaving',
      'Information Visualization & Wayfinding Systems',
      'Art History & Post-Colonial Visual Culture',
      'Interactive Spatial & Exhibition Scenography',
      'Digital Illustration & Concept Worldbuilding',
    ],
    courses: [
      { sem: 1, code: 'FAD101', title: 'Visual Language, Color Theory & Form Studio', credits: 4, lab: 2 },
      { sem: 3, code: 'FAD301', title: 'Grid Systems & Editorial Typography', credits: 4, lab: 2 },
      { sem: 4, code: 'FAD402', title: 'Interaction Design & Digital Design Systems', credits: 4, lab: 2 },
      { sem: 5, code: 'FAD501', title: 'Industrial Ergonomics & Material Prototyping', credits: 4, lab: 2 },
      { sem: 6, code: 'FAD602', title: 'Curatorial Practice & Modern Art Criticism', credits: 3, lab: 0 },
      { sem: 7, code: 'FAD701', title: 'Information Architecture & Exhibition Thesis', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'AGRI',
    name: 'Agricultural Sciences',
    block: 'Swaminathan Agro-Research Complex',
    domains: [
      'Precision Agriculture & Hyperspectral Crop Sensing',
      'Soil Microbiome & Nitrogen Fixation Chemistry',
      'Drought-Resilient Crop Breeding & Quantitative Genetics',
      'Integrated Pest Management & Biological Control',
      'Drip Fertigation & Micro-Watershed Agronomy',
      'Post-Harvest Cold Chain & Food Preservation',
      'Agroforestry & Carbon Sequestration Farming',
      'Plant Pathology & Mycological Epidemiology',
      'Horticultural Protected Cultivation Systems',
      'Agricultural Extension & Rural Market Economics',
    ],
    courses: [
      { sem: 1, code: 'AGR101', title: 'Principles of Agronomy & Agro-Meteorology', credits: 4, lab: 2 },
      { sem: 3, code: 'AGR301', title: 'Soil Chemistry, Fertility & Nutrient Management', credits: 4, lab: 2 },
      { sem: 4, code: 'AGR402', title: 'Plant Breeding & Crop Quantitative Genetics', credits: 4, lab: 2 },
      { sem: 5, code: 'AGR501', title: 'Entomology & Integrated Pest Management', credits: 4, lab: 2 },
      { sem: 6, code: 'AGR602', title: 'Precision Farming, GIS & Sensor Irrigation', credits: 4, lab: 2 },
      { sem: 7, code: 'AGR701', title: 'Seed Technology & Post-Harvest Engineering', credits: 3, lab: 2 },
    ],
  },
  {
    code: 'NURS',
    name: 'Nursing & Healthcare',
    block: 'Nightingale Clinical Simulation Pavilion',
    domains: [
      'Critical Care & ICU Hemodynamic Monitoring',
      'Community Epidemiology & Preventive Triage',
      'Maternal-Fetal & Neonatal Intensive Nursing',
      'Oncology Palliative Care & Pain Management',
      'Geriatric Rehabilitation & Chronic Disease Care',
      'Psychiatric & Trauma-Informed Clinical Nursing',
      'Hospital Infection Control & Antimicrobial Stewardship',
      'Emergency Trauma Life Support & Disaster Triage',
      'Clinical Nursing Informatics & EHR Workflows',
      'Evidence-Based Perioperative Surgical Nursing',
    ],
    courses: [
      { sem: 1, code: 'NUR101', title: 'Human Anatomy, Physiology & Clinical Foundations', credits: 4, lab: 2 },
      { sem: 3, code: 'NUR301', title: 'Medical-Surgical Nursing & Clinical Pharmacology', credits: 4, lab: 2 },
      { sem: 4, code: 'NUR402', title: 'Community Health Epidemiology & Biometrics', credits: 4, lab: 2 },
      { sem: 5, code: 'NUR501', title: 'Pediatric & Maternal-Child Clinical Care', credits: 4, lab: 2 },
      { sem: 6, code: 'NUR602', title: 'Critical Care ICU & Emergency Trauma Protocols', credits: 4, lab: 2 },
      { sem: 7, code: 'NUR701', title: 'Healthcare Quality Leadership & Clinical Audit', credits: 3, lab: 2 },
    ],
  },
  {
    code: 'PHYS',
    name: 'Department of Physics',
    block: 'Raman Quantum & Optics Laboratory',
    domains: [
      'Condensed Matter & Topological Insulators',
      'Quantum Information & Superconducting Qubits',
      'Ultrafast Nonlinear Laser Spectroscopy',
      'High-Energy Particle Phenomenology',
      'Astrophysics & Gravitational Wave Interferometry',
      'Statistical Mechanics of Non-Equilibrium Systems',
      '2D Van der Waals Heterostructures & Spintronics',
      'Plasma Confinement & Magnetohydrodynamics',
      'Soft Matter & Biological Polymer Physics',
      'Photovoltaic Perovskite Semiconductor Physics',
    ],
    courses: [
      { sem: 1, code: 'PHY101', title: 'Classical Mechanics & Relativistic Kinematics', credits: 4, lab: 2 },
      { sem: 3, code: 'PHY301', title: 'Electrodynamics & Maxwellian Wave Propagation', credits: 4, lab: 2 },
      { sem: 4, code: 'PHY402', title: 'Quantum Mechanics I: Wavefunctions & Operators', credits: 4, lab: 0 },
      { sem: 5, code: 'PHY501', title: 'Statistical Mechanics & Phase Transitions', credits: 4, lab: 0 },
      { sem: 6, code: 'PHY602', title: 'Solid State Physics & Semiconductor Band Theory', credits: 4, lab: 2 },
      { sem: 7, code: 'PHY701', title: 'Quantum Optics, Lasers & Entanglement Lab', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'CHEM',
    name: 'Department of Chemistry',
    block: 'Curie Molecular Synthesis Center',
    domains: [
      'Asymmetric Organometallic Catalysis',
      'Electrochemical Energy Storage & Solid Electrolytes',
      'Supramolecular Host-Guest Self-Assembly',
      'Computational Quantum Chemistry & DFT',
      'Total Synthesis of Bioactive Natural Products',
      'Metal-Organic Frameworks (MOFs) for Carbon Capture',
      'Photoredox Radical Polymerization',
      'Bioinorganic Metalloenzyme Mimics',
      'Ultrafast Molecular Vibrational Spectroscopy',
      'Green Solvents & Sustainable Flow Chemistry',
    ],
    courses: [
      { sem: 1, code: 'CHM101', title: 'Atomic Structure, Bonding & Coordination Chemistry', credits: 4, lab: 2 },
      { sem: 3, code: 'CHM301', title: 'Reaction Mechanisms in Organic Synthesis', credits: 4, lab: 2 },
      { sem: 4, code: 'CHM402', title: 'Chemical Thermodynamics & Electrochemistry', credits: 4, lab: 2 },
      { sem: 5, code: 'CHM501', title: 'Quantum Chemistry & Molecular Group Theory', credits: 4, lab: 0 },
      { sem: 6, code: 'CHM602', title: 'Organometallic Catalysis & Bioinorganic Systems', credits: 4, lab: 2 },
      { sem: 7, code: 'CHM701', title: 'Multi-Nuclear NMR & Mass Spectrometric Elucidation', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'MATH',
    name: 'Department of Mathematics',
    block: 'Ramanujan Pure & Applied Sciences Hall',
    domains: [
      'Partial Differential Equations & Navier-Stokes Regularity',
      'Algebraic Geometry & Cohomology Theories',
      'Stochastic Calculus & Mathematical Finance',
      'Analytic Number Theory & Modular Forms',
      'Numerical Linear Algebra & Krylov Subspace Solvers',
      'Topological Data Analysis & Persistent Homology',
      'Ergodic Theory & Dynamical Chaos Systems',
      'Convex Optimization & Semidefinite Programming',
      'Extremal Combinatorics & Spectral Graph Theory',
      'Bayesian Nonparametric Statistical Inference',
    ],
    courses: [
      { sem: 1, code: 'MAT101', title: 'Real Analysis & Metric Space Topology', credits: 4, lab: 0 },
      { sem: 2, code: 'MAT202', title: 'Linear Algebra, Eigenvalues & Canonical Forms', credits: 4, lab: 0 },
      { sem: 4, code: 'MAT401', title: 'Abstract Algebra: Groups, Rings & Galois Theory', credits: 4, lab: 0 },
      { sem: 5, code: 'MAT502', title: 'Numerical Partial Differential Equations', credits: 4, lab: 2 },
      { sem: 6, code: 'MAT601', title: 'Measure Theory, Probability & Stochastic Processes', credits: 4, lab: 0 },
      { sem: 7, code: 'MAT702', title: 'Convex Optimization & Variational Methods', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'ENGL',
    name: 'Department of English & Literature',
    block: 'Tagore Humanities & Philology Quadrangle',
    domains: [
      'Postcolonial South Asian Literary Modernisms',
      'Early Modern Shakespearean Performance & Textual Studies',
      'Digital Humanities & Computational Stylometry',
      'Comparative World Literature & Translation Theory',
      'Ecocriticism & Anthropocene Narrative Poetics',
      'Cognitive Poetics & Narrative Discourse Analysis',
      'Twentieth-Century Transatlantic Modernist Poetry',
      'Subaltern Historiography & Archival Memory',
      'Speculative Fiction & Posthuman Literary Studies',
      'Sociolinguistics & Pragmatic Corpus Analysis',
    ],
    courses: [
      { sem: 1, code: 'ENG101', title: 'History of English Literature & Poetic Forms', credits: 4, lab: 0 },
      { sem: 3, code: 'ENG301', title: 'Early Modern Drama & Renaissance Aesthetics', credits: 4, lab: 0 },
      { sem: 4, code: 'ENG402', title: 'Literary Criticism & Continental Critical Theory', credits: 4, lab: 0 },
      { sem: 5, code: 'ENG501', title: 'Postcolonial Literatures & Translation Studies', credits: 4, lab: 0 },
      { sem: 6, code: 'ENG602', title: 'Digital Humanities, Corpus Linguistics & Archive Lab', credits: 4, lab: 2 },
      { sem: 7, code: 'ENG701', title: 'World Novel, Ecocriticism & Research Colloquium', credits: 4, lab: 0 },
    ],
  },
  {
    code: 'PSYCH',
    name: 'Department of Psychology',
    block: 'Vygotsky Behavioral & Cognitive Sciences Wing',
    domains: [
      'Cognitive Neuroscience & fMRI Attention Networks',
      'Clinical Psychopathology & CBT Intervention Efficacy',
      'Developmental Executive Function in Adolescence',
      'Psychometrics & Item Response Theory Modeling',
      'Social Cognition & Implicit Attitude Formation',
      'Neuropsychology of Memory Consolidation & Aging',
      'Behavioral Addiction & Dopaminergic Reward Pathways',
      'Occupational Health & Burnout Psychophysiology',
      'Cross-Cultural Emotion Regulation',
      'Experimental Psycholinguistics & Eye-Tracking',
    ],
    courses: [
      { sem: 1, code: 'PSY101', title: 'Foundations of Cognitive & Biological Psychology', credits: 4, lab: 2 },
      { sem: 3, code: 'PSY301', title: 'Experimental Research Design & Psychometrics', credits: 4, lab: 2 },
      { sem: 4, code: 'PSY402', title: 'Developmental Lifespan & Social Psychology', credits: 4, lab: 0 },
      { sem: 5, code: 'PSY501', title: 'Clinical Psychopathology & Diagnostic Assessment', credits: 4, lab: 2 },
      { sem: 6, code: 'PSY602', title: 'Cognitive Neuroscience & Electrophysiology Lab', credits: 4, lab: 2 },
      { sem: 7, code: 'PSY701', title: 'Evidence-Based Psychotherapy & Counseling Practicum', credits: 4, lab: 2 },
    ],
  },
  {
    code: 'COMM',
    name: 'Department of Commerce',
    block: 'Pacioli Financial & Actuarial Annex',
    domains: [
      'International Financial Reporting Standards (IFRS)',
      'Forensic Accounting & Corporate Fraud Detection',
      'Direct & Cross-Border International Taxation',
      'Actuarial Valuation & Insurance Solvency Modeling',
      'Algorithmic Auditing & Internal Control Systems',
      'Capital Market Microstructure & Derivatives Clearing',
      'Cost Management & Activity-Based Industrial Accounting',
      'Banking Regulation & Basel III Capital Adequacy',
      'Corporate Insolvency & Valuation Restructuring',
      'Public Sector Auditing & Sovereign Debt Governance',
    ],
    courses: [
      { sem: 1, code: 'COM101', title: 'Advanced Financial Accounting & Reporting Standards', credits: 4, lab: 0 },
      { sem: 3, code: 'COM301', title: 'Cost & Management Accounting Systems', credits: 4, lab: 0 },
      { sem: 4, code: 'COM402', title: 'Corporate Taxation & GST Compliance Architecture', credits: 4, lab: 2 },
      { sem: 5, code: 'COM501', title: 'Auditing Assurance & Forensic Investigation', credits: 4, lab: 0 },
      { sem: 6, code: 'COM602', title: 'Financial Markets, Derivatives & Actuarial Valuation', credits: 4, lab: 2 },
      { sem: 7, code: 'COM701', title: 'International Accounting, IFRS & Corporate Valuation', credits: 4, lab: 0 },
    ],
  },
];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Vikram', 'Neha', 'Rohan', 'Priya', 'Siddharth', 'Ananya', 'Karthik', 'Meera',
  'Arjun', 'Divya', 'Rahul', 'Kavita', 'Pranav', 'Ishita', 'Varun', 'Pooja', 'Nikhil', 'Shreya',
  'Devansh', 'Tanvi', 'Harsh', 'Riya', 'Gaurav', 'Nandini', 'Kunal', 'Swati', 'Abhishek', 'sneha',
  'Manish', 'Anjali', 'Rajeev', 'pallavi', 'Saurabh', 'Kritika', 'Vivek', 'Madhuri', 'Ashwin', 'Bhavna',
  'Tarun', 'gayatri', 'Deepak', 'Shweta', 'Mayank', 'Aparna', 'chetan', 'Vidya', 'Yash', 'Roshni'
].map(n => n.charAt(0).toUpperCase() + n.slice(1));

const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Subramanian', 'Chatterjee', 'Mukherjee', 'Deshmukh', 'Kulkarni', 'Patel',
  'Mehta', 'Reddy', 'Rao', 'menon', 'Banerjee', 'Joshi', 'Bhattacharya', 'Kapoor', 'Malhotra', 'Sengupta',
  'Krishnan', 'Agarwal', 'Bose', 'Chauhan', 'Nambiar', 'Rajput', 'Saxena', 'Tiwari', 'Venkatesh', 'pillai'
].map(n => n.charAt(0).toUpperCase() + n.slice(1));

const BLOOMS_LEVELS: Array<{
  level: CourseOutcome['blooms_level'];
  numeric: number;
  verb: string;
}> = [
  { level: 'L1: Remember', numeric: 1, verb: 'Identify and recall core axioms and foundational definitions of' },
  { level: 'L2: Understand', numeric: 2, verb: 'Explain and interpret theoretical models and structural relationships in' },
  { level: 'L3: Apply', numeric: 3, verb: 'Implement and execute quantitative or procedural frameworks for' },
  { level: 'L4: Analyze', numeric: 4, verb: 'Deconstruct and benchmark multi-variable behavior and edge cases within' },
  { level: 'L5: Evaluate', numeric: 5, verb: 'Critically audit, validate, and justify trade-offs across competing paradigms in' },
  { level: 'L6: Create', numeric: 6, verb: 'Synthesize and architect novel, production-grade solutions for' },
];

export function generateOmniERPDatabase(): OmniERPDatabase {
  const faculty: FacultyRecord[] = [];
  const students: StudentRecord[] = [];
  const departments: DepartmentMetadata[] = [];

  let globalFacultyIdx = 1;
  let globalStudentIdx = 1;

  DEPARTMENT_SPECS.forEach((spec, deptIdx) => {
    const deptFaculty: FacultyRecord[] = [];

    // 1. Generate 10 Faculty members per department (20 * 10 = 200 total)
    for (let f = 0; f < 10; f++) {
      const fId = `FAC-${spec.code}-${String(globalFacultyIdx).padStart(3, '0')}`;
      const firstName = FIRST_NAMES[(deptIdx * 7 + f * 3) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(deptIdx * 5 + f * 4) % LAST_NAMES.length];
      const prefix = f < 3 ? 'Dr.' : f < 7 ? 'Dr.' : 'Prof.';
      const fullName = `${prefix} ${firstName} ${lastName}`;

      const academicTitle: FacultyRecord['academic_title'] =
        f < 2 ? 'Professor' : f < 5 ? 'Associate Professor' : 'Assistant Professor';

      const assignedCourseSpecs = [
        spec.courses[f % spec.courses.length],
        spec.courses[(f + 3) % spec.courses.length],
      ];
      // deduplicate if same
      const uniqueCourses = Array.from(new Map(assignedCourseSpecs.map(c => [c.code, c])).values());

      const daysPairs = [
        'Mon & Wed 14:00–16:00',
        'Tue & Thu 11:00–13:00',
        'Mon & Fri 15:00–17:00',
        'Wed & Fri 10:00–12:00',
        'Tue & Thu 15:30–17:30',
      ];

      const record: FacultyRecord = {
        faculty_id: fId,
        name: fullName,
        department: spec.name,
        department_code: spec.code,
        academic_title: academicTitle,
        specialized_research_domain: spec.domains[f],
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${spec.code.toLowerCase()}@omnierp.univ.edu`,
        office_hours: `${daysPairs[f % daysPairs.length]} (${spec.code}-${101 + f})`,
        office_room: `${spec.code}-FB-${201 + f}`,
        assigned_courses: uniqueCourses.map(c => c.code),
        assigned_course_titles: uniqueCourses.map(c => c.title),
        publications_count: academicTitle === 'Professor' ? 42 + f * 5 : academicTitle === 'Associate Professor' ? 22 + f * 3 : 8 + f * 2,
        max_weekly_teaching_hours: academicTitle === 'Professor' ? 12 : academicTitle === 'Associate Professor' ? 14 : 16,
      };

      faculty.push(record);
      deptFaculty.push(record);
      globalFacultyIdx++;
    }

    // 2. Build Departmental Courses with CO-PO Bloom's mappings
    const deptCourses: DepartmentCourse[] = spec.courses.map((cSpec, cIdx) => {
      const assignedFac = deptFaculty[cIdx % deptFaculty.length];
      const outcomes: CourseOutcome[] = [0, 1, 2, 3, 4].map((coIdx) => {
        const bloom = BLOOMS_LEVELS[(coIdx + (cIdx % 2)) % BLOOMS_LEVELS.length];
        const target = 65 + (coIdx * 3);
        const achieved = Number((58 + ((deptIdx * 7 + cIdx * 5 + coIdx * 9) % 34) + 0.4).toFixed(1));
        return {
          co_code: `${cSpec.code}.CO${coIdx + 1}`,
          statement: `${bloom.verb} ${cSpec.title.toLowerCase()} concepts (Module ${coIdx + 1}).`,
          blooms_level: bloom.level,
          blooms_numeric: bloom.numeric,
          mapped_pos: {
            PO1: 3,
            PO2: coIdx >= 1 ? 3 : 2,
            PO3: coIdx >= 2 ? 3 : 2,
            PO4: coIdx >= 3 ? 3 : 1,
            PO5: cSpec.lab > 0 ? 3 : 2,
            PO6: 2,
            PO7: 1,
            PO8: 2,
            PO9: cSpec.lab > 0 ? 3 : 1,
            PO10: 2,
            PO11: coIdx === 4 ? 3 : 1,
            PO12: 2,
          },
          target_attainment_pct: target,
          achieved_attainment_pct: achieved,
        };
      });

      return {
        course_code: cSpec.code,
        title: cSpec.title,
        department: spec.name,
        department_code: spec.code,
        semester: cSpec.sem,
        credit_weight: cSpec.credits,
        lecture_hours_per_week: cSpec.credits,
        lab_hours_per_week: cSpec.lab,
        enrolled_count: 35 + ((deptIdx * 3 + cIdx * 7) % 30),
        assigned_faculty_id: assignedFac.faculty_id,
        assigned_faculty_name: assignedFac.name,
        course_outcomes: outcomes,
      };
    });

    // 3. Build Classrooms for the Department
    const classrooms: ClassroomFacility[] = [
      {
        room_id: `RM-${spec.code}-101`,
        building: spec.block,
        room_type: 'Lecture Hall',
        capacity: 75,
        exam_bench_capacity: 40,
        department_allocation: spec.name,
        has_smart_podium: true,
      },
      {
        room_id: `RM-${spec.code}-102`,
        building: spec.block,
        room_type: 'Lecture Hall',
        capacity: 60,
        exam_bench_capacity: 30,
        department_allocation: spec.name,
        has_smart_podium: true,
      },
      {
        room_id: `LAB-${spec.code}-201`,
        building: spec.block,
        room_type: 'Laboratory',
        capacity: 45,
        exam_bench_capacity: 25,
        department_allocation: spec.name,
        has_smart_podium: true,
      },
      {
        room_id: `AUD-${spec.code}-301`,
        building: spec.block,
        room_type: 'Examination Auditorium',
        capacity: 120,
        exam_bench_capacity: 65,
        department_allocation: spec.name,
        has_smart_podium: true,
      },
    ];

    departments.push({
      department_id: `DEPT-${String(deptIdx + 1).padStart(2, '0')}`,
      department_code: spec.code,
      department_name: spec.name,
      school_block: spec.block,
      hod_faculty_id: deptFaculty[0].faculty_id,
      hod_name: deptFaculty[0].name,
      total_faculty: 10,
      total_students: 15,
      total_credits_required: 160,
      classrooms,
      courses: deptCourses,
    });

    // 4. Generate 15 Students per department (20 * 15 = 300 total) across Semesters 1..8
    for (let s = 0; s < 15; s++) {
      const sId = `STU-2026-${String(globalStudentIdx).padStart(4, '0')}`;
      const fName = FIRST_NAMES[(globalStudentIdx * 11 + deptIdx * 3) % FIRST_NAMES.length];
      const lName = LAST_NAMES[(globalStudentIdx * 7 + s * 5) % LAST_NAMES.length];
      const fullName = `${fName} ${lName}`;
      const semester = (s % 8) + 1;

      // Create realistic distribution where ~24% of students trigger risk_status (attendance < 75 or cgpa < 6.0)
      let attendance: number;
      let cgpa: number;
      let continuousEval: number;
      let assignmentRate: number;
      let backlogs = 0;

      if (s === 2 || s === 7 || s === 12) {
        // Low attendance & moderate/low CGPA -> at risk
        attendance = Number((56.4 + ((deptIdx * 3 + s * 2) % 17) + 0.3).toFixed(1)); // 56.7% - 73.7% (< 75%)
        cgpa = Number((5.15 + ((deptIdx + s) % 18) * 0.11).toFixed(2));
        continuousEval = Number((44 + ((deptIdx * 5 + s * 3) % 22)).toFixed(1));
        assignmentRate = Number((52 + ((deptIdx * 4 + s * 3) % 24)).toFixed(1));
        backlogs = cgpa < 6.0 ? 2 : 1;
      } else if (s === 10) {
        // Good attendance, but low CGPA < 6.0 -> at risk
        attendance = Number((77.5 + (deptIdx % 10)).toFixed(1));
        cgpa = Number((4.85 + (deptIdx % 10) * 0.1).toFixed(2)); // 4.85 - 5.75 (< 6.0)
        continuousEval = Number((48 + (deptIdx % 15)).toFixed(1));
        assignmentRate = Number((61 + (deptIdx % 15)).toFixed(1));
        backlogs = 2;
      } else {
        // Healthy academic standing (attendance >= 75 and cgpa >= 6.0)
        attendance = Number((76.2 + ((deptIdx * 5 + s * 7) % 22) + 0.4).toFixed(1)); // 76.6% - 98.6%
        cgpa = Number((6.45 + ((deptIdx * 3 + s * 9) % 33) * 0.1).toFixed(2)); // 6.45 - 9.75
        continuousEval = Number((71 + ((deptIdx * 4 + s * 6) % 27)).toFixed(1));
        assignmentRate = Number((78 + ((deptIdx * 3 + s * 5) % 22)).toFixed(1));
        backlogs = 0;
      }

      // Strictly enforce user rule: risk_status = (attendance < 75.0 || cgpa < 6.0)
      const riskStatus = attendance < 75.0 || cgpa < 6.0;

      const feeStatuses: StudentRecord['fee_payment_status'][] = ['Paid', 'Paid', 'Paid', 'Pending', 'Overdue', 'Scholarship Hold'];
      const feeStatus = riskStatus && s === 7
        ? 'Overdue'
        : feeStatuses[(globalStudentIdx + deptIdx) % feeStatuses.length];

      const advisor = deptFaculty[s % deptFaculty.length];

      students.push({
        student_id: sId,
        full_name: fullName,
        department: spec.name,
        department_code: spec.code,
        current_semester: semester,
        cgpa,
        attendance_percentage: attendance,
        risk_status: riskStatus,
        fee_payment_status: feeStatus,
        continuous_eval_score: continuousEval,
        assignment_completion_rate: assignmentRate,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}${globalStudentIdx}@student.omnierp.univ.edu`,
        advisor_faculty_id: advisor.faculty_id,
        backlogs_count: backlogs,
      });

      globalStudentIdx++;
    }
  });

  const totalCourses = departments.reduce((acc, d) => acc + d.courses.length, 0);
  const totalClassrooms = departments.reduce((acc, d) => acc + d.classrooms.length, 0);

  return {
    schema_version: '2.4.0-enterprise',
    generated_at: '2026-10-11T08:00:00Z',
    institution: 'OmniERP National Institute of Science, Law & Humanities',
    summary: {
      total_departments: departments.length,
      total_faculty: faculty.length,
      total_students: students.length,
      total_courses: totalCourses,
      total_classrooms: totalClassrooms,
    },
    departments,
    faculty,
    students,
  };
}
