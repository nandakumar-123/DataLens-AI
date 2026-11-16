import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def update_presentation():
    input_pptx = r'c:\Users\Soundar\Documents\Ai_Data_Analiser\Final PPT format.pdf.pptx'
    output_pptx = r'c:\Users\Soundar\Documents\Ai_Data_Analiser\Final PPT format.pdf.pptx'
    backup_pptx = r'c:\Users\Soundar\Documents\Ai_Data_Analiser\DataLens_AI_Final_Presentation.pptx'
    
    prs = Presentation(input_pptx)
    
    # ----------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # ----------------------------------------------------
    slide1 = prs.slides[0]
    for shape in slide1.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                txt = p.text.strip()
                if "Privacy-Preserving Generative AI for Cybersecurity Threat Detection" in txt or "Privacy-Preserving" in txt:
                    p.text = "DataLens AI: Autonomous Multi-Agent Data Analysis & AutoML Platform"
                    p.font.bold = True
                    p.font.size = Pt(24)
                    p.font.color.rgb = RGBColor(26, 35, 126) # Deep Indigo
                elif "231001102" in txt:
                    p.text = "Soundar & Team (DataLens AI Project Team)"
                    p.font.size = Pt(13)
                elif "231001105" in txt:
                    p.text = "Department of Information Technology"
                    p.font.size = Pt(13)

    # ----------------------------------------------------
    # SLIDE 2: OUTLINE
    # ----------------------------------------------------
    slide2 = prs.slides[1]
    # Update outline text if needed
    for shape in slide2.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                txt = p.text.strip()
                if "Existing System & Proposed System" in txt:
                    p.text = "• Abstract\n• Introduction to Problem Domain\n• Existing System & Proposed System\n• Architectural Design for DataLens AI\n• Algorithms & Data Science Techniques\n• Multi-Agent Workflow Modules (Agent 1 to Agent 8)\n• Validation Results & Performance Evaluation\n• Comparative Study & Benchmarks\n• References & Conclusion"
                    p.font.size = Pt(14)
                    p.font.line_spacing = 1.2

    # ----------------------------------------------------
    # SLIDE 3: OBJECTIVES
    # ----------------------------------------------------
    slide3 = prs.slides[2]
    for shape in slide3.shapes:
        if shape.has_text_frame and shape.name == "Text Box 10":
            tf = shape.text_frame
            tf.clear()
            
            objectives = [
                "To build an autonomous, multi-agent AI data science platform capable of end-to-end ingestion, profiling, cleaning, modeling, and executive presentation of tabular datasets.",
                "To automate multi-table schema reconciliation, deterministic key overlap scoring, and intelligent AI join recommendations for heterogeneous data sources.",
                "To implement automated, non-destructive data cleaning pipelines handling missing values, type casting, outlier remediation (IQR/Z-Score), and deduplication.",
                "To perform rigorous statistical research, computing descriptive statistics, interactive Pearson/Spearman correlation matrices, and hypothesis testing (T-tests, ANOVA, Chi-Square).",
                "To integrate human-in-the-loop ML preparation with proactive safety checks against target data leakage and severe class imbalance.",
                "To benchmark competing machine learning algorithms with K-Fold cross-validation and generalization gap diagnostics to eliminate overfitting.",
                "To generate executive slide presentations, interactive dashboards, and production-ready serialized scikit-learn pipeline artifacts (.pkl)."
            ]
            
            for idx, obj in enumerate(objectives):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = f"• {obj}"
                p.font.size = Pt(13.5)
                p.font.color.rgb = RGBColor(30, 41, 59)
                p.font.line_spacing = 1.15
                p.space_after = Pt(8)

    # ----------------------------------------------------
    # SLIDE 4: ABSTRACT
    # ----------------------------------------------------
    slide4 = prs.slides[3]
    for shape in slide4.shapes:
        if shape.has_text_frame and shape.name == "TextBox 6":
            tf = shape.text_frame
            tf.clear()
            
            abstract_paras = [
                "DataLens AI is an advanced, autonomous multi-agent data analytics and AutoML platform designed to streamline the end-to-end data science lifecycle from raw dataset ingestion to executive-ready presentation decks.",
                "The platform orchestrates eight specialized AI agents that execute deterministic profiling, intelligent multi-table joins, automated data cleaning, and statistical hypothesis testing (T-Tests, ANOVA, Chi-Square), while providing an interactive conversational Q&A interface for natural language dataset exploration.",
                "For machine learning, DataLens AI conducts proactive target leakage scans and class imbalance audits, followed by cross-validated AutoML benchmarking across diverse classification, regression, and clustering algorithms with generalization gap diagnostics to prevent overfitting.",
                "The system outputs interactive dashboards, downloadable scikit-learn model pipelines (.pkl), and automated presentation decks, empowering both technical analysts and executive decision-makers to extract verifiable, high-impact data intelligence rapidly."
            ]
            
            for idx, text in enumerate(abstract_paras):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = f"• {text}"
                p.font.size = Pt(14)
                p.font.color.rgb = RGBColor(30, 41, 59)
                p.font.line_spacing = 1.2
                p.space_after = Pt(10)

    # ----------------------------------------------------
    # SLIDE 5: INTRODUCTION TO PROBLEM DOMAIN
    # ----------------------------------------------------
    slide5 = prs.slides[4]
    for shape in slide5.shapes:
        if shape.has_text_frame and shape.name == "TextBox 7":
            tf = shape.text_frame
            tf.clear()
            
            intro_points = [
                "Modern organizations collect massive, heterogeneous datasets across fragmented silos, making comprehensive data analysis and modeling labor-intensive and error-prone.",
                "Data scientists spend up to 80% of their time on repetitive manual tasks, including schema matching, null imputation, type coercion, and exploratory statistical profiling.",
                "Traditional AutoML solutions operate as black boxes, frequently skipping critical data quality audits, failing to detect subtle data leakage, and yielding overfitted models.",
                "Business stakeholders and non-technical managers lack intuitive tools to interrogate data in natural language and automatically generate executive briefing decks without code.",
                "DataLens AI resolves these challenges through a transparent, 8-agent collaborative architecture that combines deterministic algorithmic rigor with LLM reasoning."
            ]
            
            for idx, text in enumerate(intro_points):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = f"• {text}"
                p.font.size = Pt(14)
                p.font.color.rgb = RGBColor(30, 41, 59)
                p.font.line_spacing = 1.2
                p.space_after = Pt(10)

    # ----------------------------------------------------
    # SLIDE 6: EXISTING SYSTEM & PROPOSED SYSTEM (TABLE)
    # ----------------------------------------------------
    slide6 = prs.slides[5]
    for shape in slide6.shapes:
        if shape.has_table:
            table = shape.table
            table_data = [
                ("Dimension / Feature", "Existing Traditional Systems", "DataLens AI (Proposed System)"),
                ("Data Ingestion & Multi-Table Joins", "Manual SQL/Pandas joins with high schema mismatch risk", "Deterministic overlap key scoring & LLM join recommendation"),
                ("Data Cleaning & Preprocessing", "Ad-hoc manual scripts; risk of silent data distortion", "Automated multi-strategy imputation, type coercion & outlier repair"),
                ("Statistical Rigor & Research", "Basic summary metrics; no automated hypothesis tests", "Automated T-Tests, ANOVA, Chi-Square & interactive heatmaps"),
                ("ML Model Safety & Validation", "Unchecked target leakage and frequent severe overfitting", "Pre-training leakage scans, imbalance guards & generalization gap checks"),
                ("Executive Delivery & Artifacts", "Manual PowerPoint deck creation and static reports", "1-click automated PPTX slide decks & serialized .pkl pipelines")
            ]
            
            for r_idx, row in enumerate(table.rows):
                for c_idx, cell in enumerate(row.cells):
                    cell.text = table_data[r_idx][c_idx]
                    for p in cell.text_frame.paragraphs:
                        p.font.size = Pt(11 if r_idx > 0 else 12)
                        p.font.bold = (r_idx == 0)
                        if r_idx == 0:
                            p.font.color.rgb = RGBColor(255, 255, 255)
                        else:
                            p.font.color.rgb = RGBColor(15, 23, 42)

    # ----------------------------------------------------
    # SLIDE 7: ARCHITECTURAL DESIGN (DESCRIPTION)
    # ----------------------------------------------------
    slide7 = prs.slides[6]
    for shape in slide7.shapes:
        if shape.has_text_frame and shape.name == "TextBox 6":
            tf = shape.text_frame
            tf.clear()
            
            arch_text = [
                "The DataLens AI architecture is structured across four collaborative tiers powered by an 8-agent autonomous pipeline:",
                "1. Ingestion & Profiling Tier (Agent 1): Ingests multi-format tabular datasets, extracts structural metadata, and evaluates key overlap ratios to formulate multi-table join strategies.",
                "2. Cleaning & Validation Tier (Agents 2 & 3): Identifies data anomalies, executes intelligent imputation and outlier management, and evaluates dataset health with a 0–100 Data Quality Score.",
                "3. Analytics & Exploration Engine (Agents 4 & 5): Generates descriptive statistical metrics, correlation matrices (Pearson/Spearman), executes p-value hypothesis tests, and powers real-time conversational Q&A.",
                "4. AutoML & Executive Delivery Tier (Agents 6, 7 & 8): Verifies learning types, scans for target data leakage, benchmarks multiple cross-validated ML models with overfitting gap analysis, and exports executive presentation decks (.pptx) and production model artifacts (.pkl)."
            ]
            
            for idx, text in enumerate(arch_text):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = text
                p.font.size = Pt(13)
                p.font.color.rgb = RGBColor(30, 41, 59)
                p.font.line_spacing = 1.15
                p.space_after = Pt(6)

    # ----------------------------------------------------
    # SLIDE 8: ARCHITECTURE DIAGRAM
    # ----------------------------------------------------
    slide8 = prs.slides[7]
    for shape in list(slide8.shapes):
        if shape.shape_type == 13: # PICTURE
            left, top, width, height = shape.left, shape.top, shape.width, shape.height
            sp = shape._element
            sp.getparent().remove(sp)
            slide8.shapes.add_picture('diagrams/architecture_diagram.png', left, top, width, height)

    # ----------------------------------------------------
    # SLIDE 9: ALGORITHMS & TECHNIQUES USED
    # ----------------------------------------------------
    slide9 = prs.slides[8]
    for shape in slide9.shapes:
        if shape.has_text_frame and shape.name == "Text Box 9":
            tf = shape.text_frame
            tf.clear()
            
            tech_content = [
                "Core Functional Algorithms & Techniques:",
                "• Multi-Agent Coordination: Deterministic state machine workflows with human-in-the-loop checkpoints.",
                "• Schema Reconciliation & Overlap: Jaccard similarity and unique key intersection scoring across tables.",
                "• Statistical Hypothesis Testing: Two-sample T-Tests, One-Way ANOVA, Chi-Square Independence, and Mann-Whitney U tests.",
                "• Machine Learning Algorithms: Random Forest, Gradient Boosting, Support Vector Machines (SVM), Logistic & Linear Regression, K-Means Clustering.",
                "• Generalization & Safety Diagnostics: K-Fold Cross-Validation, Generalization Gap (|Train - CV| > 0.08 threshold), and Mutual Information Target Leakage detection.",
                "Software Tools & Technology Stack:",
                "• Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Plotly.js, Recharts, Lucide Icons.",
                "• Backend Framework: Python 3.13, FastAPI, Uvicorn, SQLite, SQLAlchemy.",
                "• Data Science Libraries: Pandas, NumPy, SciPy, Scikit-Learn, Statsmodels, OpenPyXL, Python-PPTX."
            ]
            
            for idx, line in enumerate(tech_content):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = line
                if "Core Functional" in line or "Software Tools" in line:
                    p.font.bold = True
                    p.font.size = Pt(13)
                    p.font.color.rgb = RGBColor(30, 58, 138)
                    p.space_before = Pt(6)
                else:
                    p.font.size = Pt(11.5)
                    p.font.color.rgb = RGBColor(51, 65, 85)
                    p.space_after = Pt(3)

    # ----------------------------------------------------
    # SLIDE 10: MODULE 1 (INGESTION, PROFILING & CLEANING)
    # ----------------------------------------------------
    slide10 = prs.slides[9]
    for shape in slide10.shapes:
        if shape.has_text_frame:
            if shape.name == "TextBox 10":
                shape.text_frame.text = "Module 1: Ingestion, Profiling & Intelligent Cleaning"
                shape.text_frame.paragraphs[0].font.size = Pt(16)
                shape.text_frame.paragraphs[0].font.bold = True
            elif shape.name == "TextBox 12":
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "Agent 1 & Agent 2 handle automated dataset onboarding and cleaning. Agent 1 computes deterministic schema profiles, column data types, and multi-table overlap ratios to infer optimal join strategies. Agent 2 analyzes data anomalies (missing values, skewed outliers, type mismatches) and applies user-approved cleaning recipes without data loss."
                p.font.size = Pt(11.5)
                p.font.color.rgb = RGBColor(51, 65, 85)
            elif shape.name == "TextBox 13":
                shape.text_frame.text = "Fig. Ingestion, Profiling & Data Cleaning Pipeline"
                shape.text_frame.paragraphs[0].font.size = Pt(10)
    
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
            if shape.name == "TextBox 6":
                shape.text_frame.text = "Module 2: Validation, Statistics & Interactive Exploration"
                shape.text_frame.paragraphs[0].font.size = Pt(16)
                shape.text_frame.paragraphs[0].font.bold = True
            elif shape.name == "TextBox 11":
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "Agent 3, 4 & 5 provide scientific validation and insight discovery. Agent 3 evaluates schema constraints and scores dataset health (0-100 Quality Score). Agent 4 computes descriptive statistics, Pearson/Spearman correlation matrices, and hypothesis tests with p-values. Agent 5 provides conversational natural language Q&A for contextual exploration."
                p.font.size = Pt(11.5)
                p.font.color.rgb = RGBColor(51, 65, 85)
            elif shape.name == "TextBox 8" and "Fig" in shape.text_frame.text:
                shape.text_frame.text = "Fig. Statistical Validation, Correlation Matrix & Q&A Engine"
                shape.text_frame.paragraphs[0].font.size = Pt(10)
                
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
            if shape.name == "TextBox 6":
                shape.text_frame.text = "Module 3: ML Preparation, AutoML Benchmark & Presentation"
                shape.text_frame.paragraphs[0].font.size = Pt(16)
                shape.text_frame.paragraphs[0].font.bold = True
            elif shape.name == "TextBox 9":
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "Agent 6, 7 & 8 deliver production-ready machine learning and automated reporting. Agent 6 prepares feature pipelines, scans for data leakage, and checks class balance. Agent 7 cross-validates competing ML models, evaluating accuracy, F1, ROC-AUC, R², and generalization gap to eliminate overfitting. Agent 8 compiles executive presentation decks and exports serialized .pkl models."
                p.font.size = Pt(11.5)
                p.font.color.rgb = RGBColor(51, 65, 85)
            elif shape.name == "TextBox 8" and "Fig" in shape.text_frame.text:
                shape.text_frame.text = "Fig. ML Prep, AutoML Training Benchmark & Presentation Generation"
                shape.text_frame.paragraphs[0].font.size = Pt(10)
                
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
        if shape.has_text_frame and shape.name == "TextBox 6":
            tf = shape.text_frame
            tf.clear()
            
            references = [
                "1. J. He et al., \"AutoML in the Era of Large Language Models: A Comprehensive Survey and Vision,\" IEEE Transactions on Knowledge and Data Engineering, 2025. Focus: Integrating LLM reasoning with automated machine learning pipelines.",
                "2. M. Feurer et al., \"Auto-Sklearn 2.0: Hands-free AutoML via Meta-Learning and Automated Ensembling,\" Journal of Machine Learning Research, 2024. Focus: Benchmark evaluation protocols and overfitting prevention in tabular datasets.",
                "3. S. Hong et al., \"MetaGPT: Multi-Agent Collaborative Framework for Complex Problem Solving,\" International Conference on Learning Representations (ICLR), 2024. Focus: Multi-agent role specialization in automated software and data analytics.",
                "4. L. Wang et al., \"A Survey on Large Language Model based Autonomous Agents,\" Frontiers of Computer Science, 2024. Focus: Structured agent workflows, deterministic tool integration, and verified output generation."
            ]
            
            for idx, ref in enumerate(references):
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = ref
                p.font.size = Pt(13)
                p.font.color.rgb = RGBColor(30, 41, 59)
                p.font.line_spacing = 1.15
                p.space_after = Pt(10)

    # ----------------------------------------------------
    # SLIDE 14: THANK YOU
    # ----------------------------------------------------
    slide14 = prs.slides[13]
    for shape in slide14.shapes:
        if shape.has_text_frame and shape.name == "TextBox 3":
            shape.text_frame.text = "THANK YOU\nQuestions & Answers"
            shape.text_frame.paragraphs[0].font.size = Pt(28)
            shape.text_frame.paragraphs[0].font.bold = True
            shape.text_frame.paragraphs[0].font.color.rgb = RGBColor(30, 58, 138)

    # Save to original location and backup location
    prs.save(output_pptx)
    prs.save(backup_pptx)
    print(f'Successfully updated presentation: {output_pptx}')
    print(f'Backup saved: {backup_pptx}')

if __name__ == '__main__':
    update_presentation()
