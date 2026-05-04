from app.db.connection import get_pool
from app.core.logging import logger

async def seed_templates():
    pool = get_pool()
    # Check if templates already exist
    count = await pool.fetchval("SELECT COUNT(*) FROM templates")
    if count > 0:
        return

    templates = [
        ('Build a SaaS app', 'Build', 'You are a senior full-stack engineer. Build a SaaS application with the following spec: [DESCRIBE YOUR APP]. Use [TECH STACK]. Return a step-by-step implementation plan with file structure, key files, and deployment instructions.', ['saas','build','fullstack']),
        ('Debug an API error', 'Debug', 'You are a backend debugging expert. I am getting this error: [PASTE ERROR]. My code is: [PASTE CODE]. Diagnose the root cause, explain why it happens, and provide a corrected code snippet.', ['debug','api','error']),
        ('Create a data pipeline', 'Build', 'You are a data engineer. Design and implement a data pipeline that: [DESCRIBE PIPELINE]. Use [TECH STACK]. Include error handling, logging, and retry logic.', ['data','pipeline','etl']),
        ('Design a database schema', 'Design', 'You are a database architect. Design a PostgreSQL schema for: [DESCRIBE SYSTEM]. Include tables, relationships, indexes, and constraints. Explain your design decisions.', ['database','schema','sql']),
        ('Write a system prompt', 'Write', 'You are a prompt engineer. Write a production-quality system prompt for an AI assistant that: [DESCRIBE ROLE AND BEHAVIOR]. Include persona, constraints, output format, and example interactions.', ['prompt','system','ai']),
        ('Create a React component', 'Build', 'You are a senior React developer. Build a [COMPONENT NAME] component that: [DESCRIBE FUNCTIONALITY]. Use TypeScript, Tailwind CSS, and proper hooks. Include props interface and usage example.', ['react','component','frontend']),
        ('Fix a failing test', 'Debug', 'You are a testing expert. This test is failing: [PASTE TEST]. The error is: [PASTE ERROR]. The implementation is: [PASTE CODE]. Fix the test and explain what was wrong.', ['testing','debug','jest']),
        ('Explain a codebase', 'Write', 'You are a senior engineer doing a code review. Analyze this codebase: [PASTE CODE]. Explain the architecture, identify potential issues, suggest improvements, and rate the code quality from 1-10 with justification.', ['review','explain','architecture']),
        ('Write a SQL query', 'Build', 'You are a SQL expert. Write an optimized PostgreSQL query that: [DESCRIBE QUERY NEED]. Include indexes that would improve performance and explain the query execution plan.', ['sql','query','database']),
        ('Plan a sprint', 'Write', 'You are a senior engineering manager. Break down this feature into sprint tasks: [DESCRIBE FEATURE]. Create user stories, estimate story points, identify dependencies, and flag risks.', ['planning','sprint','agile'])
    ]

    try:
        await pool.executemany("""
            INSERT INTO templates (name, category, content, tags)
            VALUES ($1, $2, $3, $4)
        """, templates)
        logger.info("templates_seeded")
    except Exception as e:
        logger.error("template_seeding_failed", error=str(e))
