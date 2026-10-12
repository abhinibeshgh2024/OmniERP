import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { generateOmniERPDatabase } from './src/data/datasetGenerator.js';
import {
  executeNLQPipeline,
  solveCSPSchedule,
  runEarlyWarningAnalytics,
  generateOBEComplianceReport,
} from './src/services/omniErpEngines.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Generate & persist the complete 20-department, 200-faculty, 300-student JSON relational dataset
  const db = generateOmniERPDatabase();
  const dataDir = path.resolve(__dirname, 'backend', 'data');
  const jsonFilePath = path.resolve(dataDir, 'omnierp_database.json');
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(jsonFilePath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist omnierp_database.json:', err);
  }

  // API Route 0: Health & Architecture Verification
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'OPERATIONAL',
      architecture: 'Deterministic Local Intelligence Pipeline (Zero External API Keys)',
      departments_loaded: db.departments.length,
      faculty_loaded: db.faculty.length,
      students_loaded: db.students.length,
      total_courses: db.summary.total_courses,
      total_classrooms: db.summary.total_classrooms,
    });
  });

  // API Route 1: Full Relational Dataset Endpoint
  app.get('/api/v1/dataset', (req, res) => {
    const deptCode = typeof req.query.department_code === 'string' ? req.query.department_code : undefined;
    const semester = req.query.semester ? parseInt(String(req.query.semester), 10) : undefined;

    let departments = db.departments;
    let faculty = db.faculty;
    let students = db.students;

    if (deptCode) {
      departments = departments.filter((d) => d.department_code === deptCode);
      faculty = faculty.filter((f) => f.department_code === deptCode);
      students = students.filter((s) => s.department_code === deptCode);
    }
    if (semester) {
      students = students.filter((s) => s.current_semester === semester);
    }

    res.json({
      summary: db.summary,
      departments,
      faculty,
      students,
    });
  });

  // API Route 2: Natural Language Query & Command Router
  app.post('/api/v1/nlq/execute', (req, res) => {
    const query = String(req.body?.query || '').trim();
    if (!query) {
      res.status(400).json({ error: 'Query string is required.' });
      return;
    }
    const result = executeNLQPipeline(db, query);
    res.json(result);
  });

  // API Route 3: Automated Conflict-Free Timetable & Exam Allocator (CSP Engine)
  app.post('/api/v1/scheduler/allocate', (req, res) => {
    const mode = req.body?.mode === 'EXAM_HALL_ALLOCATION' ? 'EXAM_HALL_ALLOCATION' : 'LECTURE_TIMETABLE';
    const departmentCode = req.body?.department_code || undefined;
    const semester = req.body?.semester ? Number(req.body.semester) : undefined;
    const schedule = solveCSPSchedule(db, mode, departmentCode, semester);
    res.json(schedule);
  });

  // API Route 4: Predictive Early Warning Dashboard Engine
  app.get('/api/v1/early-warning/analyze', (req, res) => {
    const deptCode = typeof req.query.department_code === 'string' ? req.query.department_code : undefined;
    const semester = req.query.semester ? parseInt(String(req.query.semester), 10) : undefined;
    const onlyAtRisk = req.query.only_at_risk === 'true';
    const analysis = runEarlyWarningAnalytics(db, deptCode, semester, onlyAtRisk);
    res.json(analysis);
  });

  // API Route 5: Outcome-Based Education (OBE) Compliance Generator
  app.get('/api/v1/obe/compliance', (req, res) => {
    const deptCode = typeof req.query.department_code === 'string' ? req.query.department_code : undefined;
    const semester = req.query.semester ? parseInt(String(req.query.semester), 10) : undefined;
    const courseCode = typeof req.query.course_code === 'string' ? req.query.course_code : undefined;
    const report = generateOBEComplianceReport(db, deptCode, semester, courseCode);
    res.json(report);
  });

  // API Route 6: Inspect Python FastAPI Backend Source Files
  app.get('/api/v1/python-files', (_req, res) => {
    const filesToRead = [
      { path: 'backend/main.py', title: 'main.py — FastAPI Entrypoint & REST Router' },
      { path: 'backend/models.py', title: 'models.py — Pydantic v2 Validation Schemas' },
      { path: 'backend/services/nlq_router.py', title: 'services/nlq_router.py — Deterministic NLQ & AST Engine' },
      { path: 'backend/services/csp_scheduler.py', title: 'services/csp_scheduler.py — CSP Timetable & Exam Solver' },
      { path: 'backend/services/early_warning.py', title: 'services/early_warning.py — Multi-Factor Risk Engine' },
      { path: 'backend/services/obe_compliance.py', title: 'services/obe_compliance.py — Bloom’s Taxonomy CO-PO Mapper' },
      { path: 'backend/requirements.txt', title: 'requirements.txt — Python Dependencies' },
    ];

    const loadedFiles = filesToRead.map((item) => {
      const fullPath = path.resolve(__dirname, item.path);
      let content = '';
      try {
        content = fs.readFileSync(fullPath, 'utf-8');
      } catch {
        content = '# File not found';
      }
      return {
        ...item,
        content,
      };
    });

    res.json({ files: loadedFiles });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniERP University Operating System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
