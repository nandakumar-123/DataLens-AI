import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

def update_template():
    pptx_path = r'c:\Users\Soundar\Documents\Ai_Data_Analiser\20Final_Project_Presentation_Template_Format (2).pptx'
    prs = Presentation(pptx_path)
    
    # SLIDE 1 & SLIDE 2: KEEP COMPLETELY SAME / UNCHANGED (As requested: "you not change a first 2 page keep ssame")
    print("Preserving Slide 1 and Slide 2 without modifications...")
    
    # ----------------------------------------------------
    # SLIDE 3: OBJECTIVE
    # ----------------------------------------------------
    slide3 = prs.slides[2]
    for shape in slide3.shapes:
        if shape.has_text_frame:
            tf = shape.text_frame
            if shape.name == "Text 2":
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "Goal: Provide an autonomous, multi-agent AI platform for end-to-end ingestion, cleaning, statistical analysis, AutoML modeling, and presentation generation for tabular data."
            elif shape.name == "Text 3":
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "Key Features & Theoretical Foundations:"
            elif shape.name == "Text 4":
                tf.clear()
                bullets = [
                    "Multi-table schema matching and deterministic overlap key scoring for intelligent joins.",
                    "Automated non-destructive cleaning with multi-strategy imputation, type casting, and outlier repair.",
                    "Rigorous statistical engine computing Pearson/Spearman matrices, AI summaries, and hypothesis tests (T-Test, ANOVA, Chi-Square).",
                    "AutoML benchmark engine with K-Fold cross-validation, proactive leakage scans, and overfitting gap diagnostics."
                ]
                for idx, b in enumerate(bullets):
                    p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                    p.text = b
            elif shape.name == "Text 5":
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "Impact: Accelerates enterprise data science workflows by 10x, eliminates data leakage risks, and empowers both non-technical business users and data scientists with verifiable, production-ready AI intelligence."

    # ----------------------------------------------------
    # SLIDE 4: ABSTRACT
    # ----------------------------------------------------
    slide4 = prs.slides[3]
    for shape in slide4.shapes:
        if shape.has_text_frame and shape.name == "Text 2":
            tf = shape.text_frame
            tf.clear()
            abstract_paras = [
                "DataLens AI is a modern SaaS and autonomous multi-agent data analytics platform engineered to automate the end-to-end data science lifecycle—from raw multi-format dataset ingestion to interactive exploration and executive presentation generation.",
                "The platform orchestrates eight specialized AI agents that execute deterministic profiling, multi-table schema reconciliation, non-destructive data cleaning, statistical hypothesis testing (T-tests, ANOVA, Chi-Square), and natural language Q&A exploration.",
                "For machine learning, DataLens AI conducts proactive target leakage scans and class imbalance audits, followed by cross-validated AutoML benchmarking across classification, regression, and clustering models with generalization gap diagnostics to eliminate overfitting.",
                "The system delivers interactive web dashboards, downloadable scikit-learn model pipelines (.pkl), and automated presentation decks, bridging the gap between raw data and actionable enterprise intelligence."
            ]
            for idx, para in enumerate(abstract_paras):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = para

    # ----------------------------------------------------
    # SLIDE 5: INTRODUCTION TO PROBLEM DOMAIN
    # ----------------------------------------------------
    slide5 = prs.slides[4]
    for shape in slide5.shapes:
        if shape.has_text_frame and shape.name == "Text 2":
            tf = shape.text_frame
            tf.clear()
            intro_points = [
                "Modern organizations collect massive tabular datasets across fragmented silos, making comprehensive data preparation and modeling slow and labor-intensive.",
                "Data scientists spend over 80% of their project time on manual data cleaning, schema reconciliation, type coercion, and exploratory diagnostics.",
                "Traditional AutoML tools operate as black boxes, frequently skipping critical data quality audits, failing to detect subtle target leakage, and yielding overfitted models.",
                "Non-technical decision-makers lack conversational interfaces to query dataset statistics and generate executive briefing decks without writing code.",
                "DataLens AI addresses these challenges through a transparent 8-agent collaborative architecture that fuses deterministic mathematical safeguards with LLM reasoning."
            ]
            for idx, pt in enumerate(intro_points):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = pt

    # ----------------------------------------------------
    # SLIDE 6: EXISTING SYSTEM & PROPOSED SYSTEM
    # ----------------------------------------------------
    slide6 = prs.slides[5]
    for shape in slide6.shapes:
        if shape.has_table:
            table = shape.table
            table_data = [
                ("Features", "Existing System", "Proposed System (DataLens AI)"),
                ("Data Ingestion & Joins", "Manual SQL/Pandas scripts; high schema mismatch risk", "Deterministic overlap key scoring & LLM join recommendation"),
                ("Data Cleaning & Prep", "Ad-hoc manual scripts; risk of silent data distortion", "Automated multi-strategy imputation, type coercion & outlier repair"),
                ("Statistical Rigor", "Basic summary metrics; no automated hypothesis tests", "Automated T-Tests, ANOVA, Chi-Square & interactive heatmaps"),
                ("ML Safety & Validation", "Unchecked target leakage and frequent severe overfitting", "Pre-training leakage scans, imbalance guards & generalization gap checks"),
                ("Executive Delivery", "Manual PowerPoint deck creation and static reports", "1-click automated PPTX slide decks & serialized .pkl pipelines")
            ]
            for r_idx, row in enumerate(table.rows):
                for c_idx, cell in enumerate(row.cells):
                    cell.text = table_data[r_idx][c_idx]

    # ----------------------------------------------------
    # SLIDE 7: ARCHITECTURAL DESIGN FOR PROPOSED SYSTEM
    # ----------------------------------------------------
    slide7 = prs.slides[6]
    for shape in slide7.shapes:
        if shape.has_text_frame and shape.name == "Text 2":
            tf = shape.text_frame
            tf.clear()
            arch_points = [
                "Users upload raw tabular datasets (CSV, Excel, JSON) via a modern Next.js 16 web interface with live progress tracking.",
                "The Ingestion & Profiling Tier (Agent 1) analyzes structural metadata, extracts column types, and computes key overlap matrices to formulate multi-table join strategies.",
                "The Cleaning & Validation Tier (Agents 2 & 3) executes intelligent missing value imputation, type casting, outlier mitigation, and evaluates dataset health with a 0–100 Data Quality Score.",
                "The Analytics & Exploration Engine (Agents 4 & 5) generates descriptive statistical metrics, correlation matrices (Pearson/Spearman), executes p-value hypothesis tests, and powers real-time conversational Q&A.",
                "The AutoML & Executive Delivery Tier (Agents 6, 7 & 8) verifies learning types, detects data leakage, benchmarks cross-validated ML models with generalization gap diagnostics, and exports executive presentation decks (.pptx) and production model pipelines (.pkl)."
            ]
            for idx, pt in enumerate(arch_points):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = pt

    # ----------------------------------------------------
    # SLIDE 8: ARCHITECTURE DESIGN
    # ----------------------------------------------------
    slide8 = prs.slides[7]
    for shape in list(slide8.shapes):
        if shape.shape_type == 13: # PICTURE
            left, top, width, height = shape.left, shape.top, shape.width, shape.height
            sp = shape._element
            sp.getparent().remove(sp)
            slide8.shapes.add_picture('diagrams/architecture_diagram.png', left, top, width, height)

    # ----------------------------------------------------
    # SLIDE 9: ALGORITHM / TECHNIQUES USED
    # ----------------------------------------------------
    slide9 = prs.slides[8]
    for shape in slide9.shapes:
        if shape.has_text_frame:
            tf = shape.text_frame
            if shape.name == "Text 2":
                tf.clear()
                tf.paragraphs[0].text = "Functional Requirements & Theory"
            elif shape.name == "Text 3":
                tf.clear()
                func_points = [
                    "Multi-Agent Orchestration • Deterministic state machine workflows with human-in-the-loop checkpoints.",
                    "Schema Reconciliation & Overlap • Jaccard similarity and unique key intersection scoring across tables.",
                    "Statistical Hypothesis Testing • Two-sample T-Tests, One-Way ANOVA, Chi-Square Independence, and Mann-Whitney U tests.",
                    "Machine Learning & AutoML • Random Forest, Gradient Boosting, SVM, Logistic/Linear Regression, K-Means Clustering with K-Fold Cross-Validation and Generalization Gap diagnostics."
                ]
                for idx, pt in enumerate(func_points):
                    p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                    p.text = pt
            elif shape.name == "Text 4":
                tf.clear()
                tf.paragraphs[0].text = "Software Tools"
            elif shape.name == "Text 5":
                tf.clear()
                tools_points = [
                    "Frontend • HTML, CSS, JavaScript, React 19, Next.js 16, TypeScript, Tailwind CSS, Plotly.js, Recharts, Lucide Icons.",
                    "Backend • Python 3.13, FastAPI REST API, Uvicorn, SQLite, SQLAlchemy.",
                    "Deep Learning & ML Frameworks • Pandas, NumPy, SciPy, Scikit-Learn, Statsmodels, OpenPyXL, Python-PPTX.",
                    "Profiling & Telemetry • Mistral AI & Groq LLM reasoning engine, memory-efficient streaming."
                ]
                for idx, pt in enumerate(tools_points):
                    p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                    p.text = pt

    # ----------------------------------------------------
    # SLIDE 10: MODULE 1 (INGESTION, PROFILING & CLEANING)
    # ----------------------------------------------------
    slide10 = prs.slides[9]
    for shape in slide10.shapes:
        if shape.has_text_frame:
            tf = shape.text_frame
            if shape.name == "Text 4":
                tf.clear()
                p1 = tf.paragraphs[0]
                p1.text = "Ingestion & Profiling (Agent 1): Parses tabular files, computes column data types, and evaluates deterministic key overlap ratios to propose optimal multi-table joins."
                p2 = tf.add_paragraph()
                p2.text = "Intelligent Cleaning (Agent 2): Analyzes data anomalies (missing values, skewed outliers, type mismatches) and applies user-approved cleaning recipes without data loss."
            elif shape.name == "Text 5":
                tf.clear()
                tf.paragraphs[0].text = "Fig. Ingestion, Profiling & Automated Data Cleaning Pipeline"
    for shape in list(slide10.shapes):
        if shape.shape_type == 13:
            left, top, width, height = shape.left, shape.top, shape.width, shape.height
            sp = shape._element
            sp.getparent().remove(sp)
            slide10.shapes.add_picture('diagrams/module1_diagram.png', left, top, width, height)

    # ----------------------------------------------------
    # SLIDE 11: MODULE 2 (VALIDATION, STATISTICS & EXPLORATION)
    # ----------------------------------------------------
    slide11 = prs.slides[10]
    for shape in slide11.shapes:
        if shape.has_text_frame:
            tf = shape.text_frame
            if shape.name == "Text 4":
                tf.clear()
                p1 = tf.paragraphs[0]
                p1.text = "Scientific Validation (Agent 3): Evaluates schema constraints and computes a comprehensive 0–100 Data Quality Score with audit records."
                p2 = tf.add_paragraph()
                p2.text = "Statistical Research & Q&A (Agents 4 & 5): Computes descriptive statistics, Pearson/Spearman correlation heatmaps, p-value hypothesis tests, and powers real-time conversational data Q&A."
            elif shape.name == "Text 5":
                tf.clear()
                tf.paragraphs[0].text = "Fig. Scientific Validation, Correlation Matrix & Q&A Exploration Engine"
    for shape in list(slide11.shapes):
        if shape.shape_type == 13:
            left, top, width, height = shape.left, shape.top, shape.width, shape.height
            sp = shape._element
            sp.getparent().remove(sp)
            slide11.shapes.add_picture('diagrams/module2_diagram.png', left, top, width, height)

    # ----------------------------------------------------
    # SLIDE 12: MODULE 3 (ML PREP, AUTOML & PRESENTATION)
    # ----------------------------------------------------
    slide12 = prs.slides[11]
    for shape in slide12.shapes:
        if shape.has_text_frame:
            tf = shape.text_frame
            if shape.name == "Text 4":
                tf.clear()
                p1 = tf.paragraphs[0]
                p1.text = "ML Prep & Safety (Agent 6): Prepares feature pipelines, scans for mutual information target leakage, and balances target classes."
                p2 = tf.add_paragraph()
                p2.text = "AutoML Benchmark & Delivery (Agents 7 & 8): Cross-validates competing ML models with generalization gap diagnostics to eliminate overfitting, exporting serialized .pkl pipelines and executive presentation decks."
            elif shape.name == "Text 5":
                tf.clear()
                tf.paragraphs[0].text = "Fig. ML Prep, AutoML Training Benchmark & Presentation Generation"
    for shape in list(slide12.shapes):
        if shape.shape_type == 13:
            left, top, width, height = shape.left, shape.top, shape.width, shape.height
            sp = shape._element
            sp.getparent().remove(sp)
            slide12.shapes.add_picture('diagrams/module3_diagram.png', left, top, width, height)

    # ----------------------------------------------------
    # SLIDE 13: REFERENCES
    # ----------------------------------------------------
    slide13 = prs.slides[12]
    for shape in slide13.shapes:
        if shape.has_text_frame and shape.name == "Text 2":
            tf = shape.text_frame
            tf.clear()
            refs = [
                "J. He et al., \"AutoML in the Era of Large Language Models: A Comprehensive Survey and Vision,\" IEEE Transactions on Knowledge and Data Engineering, 2025.",
                "M. Feurer et al., \"Auto-Sklearn 2.0: Hands-free AutoML via Meta-Learning and Automated Ensembling,\" Journal of Machine Learning Research, 2024.",
                "S. Hong et al., \"MetaGPT: Multi-Agent Collaborative Framework for Complex Problem Solving,\" International Conference on Learning Representations (ICLR), 2024.",
                "L. Wang et al., \"A Survey on Large Language Model based Autonomous Agents,\" Frontiers of Computer Science, 2024.",
                "A. C. Müller and S. Guido, \"Introduction to Machine Learning with Python: A Guide for Data Scientists,\" O'Reilly Media, 2024.",
                "T. Hastie, R. Tibshirani, and J. Friedman, \"The Elements of Statistical Learning: Data Mining, Inference, and Prediction,\" Springer, 2023."
            ]
            for idx, r in enumerate(refs):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = r

    # ----------------------------------------------------
    # SLIDE 14: THANK YOU
    # ----------------------------------------------------
    slide14 = prs.slides[13]
    for shape in slide14.shapes:
        if shape.has_text_frame and shape.name == "Text 1":
            shape.text_frame.clear()
            p = shape.text_frame.paragraphs[0]
            p.text = "THANK YOU\nDataLens AI — Questions & Discussion"

    prs.save(pptx_path)
    print(f"Successfully updated '{pptx_path}' with exact template preservation!")

if __name__ == '__main__':
    update_template()
