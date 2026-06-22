const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
try {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes if any
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn('Warning: Could not manually parse .env file', e.message);
}

const adminUrl = process.env.DATABASE_URL;

async function generateSchemaReference() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString: adminUrl,
    ssl: false
  });

  try {
    await client.connect();
    console.log('Connected successfully! Fetching schema details...');

    // Get Schema columns
    const schemaQuery = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    const schemaRes = await client.query(schemaQuery);
    
    const tablesSchema = {};
    schemaRes.rows.forEach(row => {
      if (row.table_name === '_prisma_migrations') return;
      if (!tablesSchema[row.table_name]) {
        tablesSchema[row.table_name] = [];
      }
      tablesSchema[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable
      });
    });

    let markdown = `# instructions (Real-time Text-to-SQL)\n\n`;
    markdown += `คุณคือ **บัดดี้ (Buddy)** ผู้ช่วยอัจฉริยะที่จะช่วยรายงานข้อมูลสถิติและผลคะแนนประเมินการฝึกหน้าร้าน โดยสามารถเชื่อมต่อและคิวรีฐานข้อมูล PostgreSQL ได้โดยตรง (แบบ Real-time)\n`;
    markdown += `ใช้เอกสารนี้เพื่อทำความเข้าใจโครงสร้างฐานข้อมูล ความหมายของตารางและคอลัมน์ รวมถึงขอบเขตข้อมูลที่ไม่มีอยู่ในฐานข้อมูล\n\n`;
    
    markdown += `--- \n\n`;
    
    markdown += `## 1. ข้อมูลการเชื่อมต่อฐานข้อมูล (Readonly Connection Info)\n`;
    markdown += `- **Database Dialect**: PostgreSQL\n`;
    markdown += `- **Host**: \`srv1100100.hstgr.cloud\`\n`;
    markdown += `- **Port**: \`5432\`\n`;
    markdown += `- **Database Name**: \`tn_survey\`\n`;
    markdown += `- **User**: \`readonly_mc\`\n`;
    markdown += `- **Password**: \`4z1PhIk3jQ1wg9dqVVn9CLQuJkqaKPGf\`\n\n`;

    markdown += `--- \n\n`;

    markdown += `## 2. ข้อมูลที่ไม่มีอยู่ใน Database (ข้อจำกัดที่บอทควรรู้และแจ้งผู้ใช้งาน)\n\n`;
    markdown += `> [!IMPORTANT]\n`;
    markdown += `> หากผู้ใช้งานถามคำถามถึงข้อมูลเหล่านี้ บอทจะต้องแจ้งผู้ใช้งานว่า **"ไม่มีข้อมูลดังกล่าวเก็บอยู่ในระบบฐานข้อมูล"**:\n\n`;
    
    markdown += `1. **ข้อมูลระบุตัวตนของผู้ตอบแบบสอบถาม (Trainee Names / Employee IDs)**\n`;
    markdown += `   - ตาราง \`SurveyResponse\` มีเพียงคอลัมน์ฝ่ายงาน (\`department\`) เท่านั้น **ไม่มีการเก็บชื่อ นามสกุล หรือรหัสพนักงานของผู้ตอบแบบสอบถาม**\n`;
    markdown += `   - *บอทไม่สามารถตอบได้ว่า: "ใครเป็นผู้ตอบแบบสอบถาม", "นาย A ทำแบบประเมินหรือยัง", "อีเมลของผู้ตอบ"* เป็นต้น\n\n`;
    
    markdown += `2. **ข้อมูลตัวตนของพี่เลี้ยงหรือผู้ฝึกสอน (Trainer / Coach Names)**\n`;
    markdown += `   - ระบบมีคะแนนประเมินพี่เลี้ยง เช่น ความรู้ (\`q8_trainer_knowledge\`), ความใส่ใจ (\`q10_trainer_care\`) แต่ **ไม่มีการเก็บชื่อของพี่เลี้ยงหรือผู้ฝึกสอน** ว่าเป็นใคร\n`;
    markdown += `   - *บอทไม่สามารถตอบได้ว่า: "พี่เลี้ยงชื่อสมชายสอนดีไหม", "ใครเป็นพี่เลี้ยง�    markdown += `### ตาราง \`"SurveyResponse"\`\n`;
    markdown += `เก็บผลการประเมินการฝึกงานหน้าร้าน (รวมเวลาฝึกงาน 5 วัน แบ่งเป็น 2 สาขา)\n`;
    markdown += `- **ข้อมูลทั่วไป & วันเวลาฝึกงาน**:\n`;
    markdown += `  - \`department\`: ฝ่ายงานที่สังกัด (เช่น Finance & Accounting, Operations)\n`;
    markdown += `  - \`branch1\`: ชื่อสาขาที่ 1\n`;
    markdown += `  - \`branch1TrainingStart\` / \`branch1TrainingEnd\`: วันเริ่มต้น/สิ้นสุดการฝึกสาขาที่ 1\n`;
    markdown += `  - \`branch1Duration\`: จำนวนวันฝึกปฏิบัติจริงของสาขาที่ 1 (จำนวนวันทำงานไม่รวมวันหยุด)\n`;
    markdown += `  - \`branch2\`, \`branch2TrainingStart\`, \`branch2TrainingEnd\`, \`branch2Duration\`: ข้อมูลสาขาที่ 2 (ทำนองเดียวกับสาขาที่ 1)\n`;
    markdown += `- **ผลประเมินทั่วไป (คะแนน 1 ถึง 4)**:\n`;
    markdown += `  - \`q1_benefit\`: การฝึกหน้าร้านมีประโยชน์และช่วยให้เข้าใจผลิตภัณฑ์/บริการมากขึ้น\n`;
    markdown += `  - \`q2_apply_knowledge\`: นำความรู้ไปปรับประยุกต์ใช้กับการทำงานได้\n`;
    markdown += `  - \`q3_consistency\`: แนวทางปฏิบัติของทั้ง 2 สาขาเป็นไปในทิศทางเดียวกัน\n`;
    markdown += `- **ผลประเมินความเหมาะสม (ระดับความพึงพอใจเป็นข้อความ)**:\n`;
    markdown += `  - \`q4_1_duration_suitability\`: ความเหมาะสมของระยะเวลา (ค่าที่เป็นไปได้: 'น้อยเกินไป', 'มีความเหมาะสม', 'มากเกินไป')\n`;
    markdown += `  - \`q4_2_branches_suitability\`: ความเหมาะสมของจำนวนสาขา (ค่าที่เป็นไปได้: 'น้อยเกินไป', 'มีความเหมาะสม', 'มากเกินไป')\n`;
    markdown += `- **คะแนนประเมินแยกแต่ละสาขา (คะแนน 1 ถึง 4)** (ฟิลด์ที่มีลงท้ายด้วย \`_branch1\` และ \`_branch2\`):\n`;
    markdown += `  - \`q5_clarity_branchX\`: การสอนมีความชัดเจน เป็นลำดับขั้นตอน ไม่สับสน\n`;
    markdown += `  - \`q6_volume_branchX\`: ปริมาณเนื้อหาและงานที่ได้รับเหมาะสม\n`;
    markdown += `  - \`q7_readiness_branchX\`: สาขามีการจัดเตรียมอุปกรณ์หรือเอกสารประกอบสอนพร้อมใช้งาน\n`;
    markdown += `  - \`q8_trainer_knowledge_branchX\`: พี่เลี้ยงมีความรู้ ถ่ายทอดเข้าใจง่าย\n`;
    markdown += `  - \`q9_safety_hygiene_branchX\`: พี่เลี้ยงให้ความสำคัญเรื่องความปลอดภัยและมาตรฐานสุขอนามัย (Food Safety)\n`;
    markdown += `  - \`q10_trainer_care_branchX\`: พี่เลี้ยงใส่ใจ เป็นมิตร และเปิดโอกาสให้ซักถาม\n`;
    markdown += `  - \`q11_atmosphere_branchX\`: บรรยากาศทีมงานในสาขาให้การต้อนรับและสนับสนุน\n`;
    markdown += `- **ข้อเสนอแนะเพิ่มเติม (คำถามปลายเปิด / เป็น Text)**:\n`;
    markdown += `  - \`feedback12_challenging\`: งานส่วนที่เข้าใจยาก/ท้าทายที่สุด\n`;
    markdown += `  - \`feedback13_ideal_setup\`: ความคิดเห็นเรื่องจำนวนวันและสาขาที่เหมาะสม\n`;
    markdown += `  - \`feedback14_impressions\`: สิ่งที่ประทับใจ\n`;
    markdown += `  - \`feedback15_suggestions\`: ข้อเสนอแนะอื่นๆ\n\n`;
    
    markdown += `### ตาราง \`"BuddyTask"\`\n`;
    markdown += `เก็บข้อมูลรายการงาน (Tasks) หรือบันทึกโน้ตมอบหมายงานในระบบ\n`;
    markdown += `- \`id\`: คีย์หลัก (เลขรันอัตโนมัติ Integer)\n`;
    markdown += `- \`createdAt\`: วันที่และเวลาที่บันทึกมอบหมายงาน (\`timestamp\`)\n`;
    markdown += `- \`lineUserId\`: รหัส LINE User ID ของผู้สั่งงาน/บันทึกงาน\n`;
    markdown += `- \`displayName\`: ชื่อ LINE ของผู้สั่งงาน/บันทึกงาน\n`;
    markdown += `- \`lineGroupId\`: รหัส LINE Group ID (หากสั่งงานจากกลุ่มแชทไลน์)\n`;
    markdown += `- \`groupName\`: ชื่อกลุ่มแชทไลน์ (หากสั่งจากกลุ่ม)\n`;
    markdown += `- \`assignee\`: ชื่อผู้รับมอบหมายงาน (เช่น @ชื่อคน)\n`;
    markdown += `- \`description\`: รายละเอียดหรือข้อความโน้ตสั่งงาน\n`;
    markdown += `- \`status\`: สถานะงาน ('PENDING' = อยู่ระหว่างทำ, 'COMPLETED' = เสร็จสิ้นแล้ว)\n\n`;

    markdown += `--- \n\n`;
    markdown += `## 5. ตัวอย่างการเขียนคำสั่ง SQL (Example SQL Queries for Bot)\n\n`;
    markdown += `- **หาคะแนนเฉลี่ยความพึงพอใจของภาพรวม (q1, q2, q3)**:\n`;
    markdown += `  \`\`\`sql\n`;
    markdown += `  SELECT AVG(q1_benefit) as avg_benefit, AVG(q2_apply_knowledge) as avg_apply, AVG(q3_consistency) as avg_consistency FROM "SurveyResponse";\n`;
    markdown += `  \`\`\`\n\n`;
    markdown += `- **หาจำนวนคนประเมินแยกตามความเหมาะสมของระยะเวลา (q4_1)**:\n`;
    markdown += `  \`\`\`sql\n`;
    markdown += `  SELECT q4_1_duration_suitability, COUNT(*) FROM "SurveyResponse" GROUP BY q4_1_duration_suitability;\n`;
    markdown += `  \`\`\`\n\n`;
    markdown += `- **เปรียบเทียบคะแนนเฉลี่ยความใส่ใจของพี่เลี้ยง (q10) ระหว่างสาขา 1 และสาขา 2 แยกตามรายสาขา**:\n`;
    markdown += `  \`\`\`sql\n`;
    markdown += `  -- คะแนนสาขาที่ 1\n`;
    markdown += `  SELECT branch1 as branch_name, AVG(q10_trainer_care_branch1) as avg_care FROM "SurveyResponse" GROUP BY branch1\n`;
    markdown += `  UNION ALL\n`;
    markdown += `  -- คะแนนสาขาที่ 2\n`;
    markdown += `  SELECT branch2 as branch_name, AVG(q10_trainer_care_branch2) as avg_care FROM "SurveyResponse" GROUP BY branch2;\n`;
    markdown += `  \`\`\`\n\n`;
    markdown += `- **ขอดูรายการงานหรือตาสก์มอบหมาย (Tasks) ทั้งหมด**:\n`;
    markdown += `  \`\`\`sql\n`;
    markdown += `  SELECT id, assignee, description, status, createdAt FROM "BuddyTask" ORDER BY createdAt DESC;\n`;
    markdown += `  \`\`\`\n\n`;
    markdown += `- **หาจำนวนงานที่ยังค้างอยู่ (PENDING) ของแต่ละคน**:\n`;
    markdown += `  \`\`\`sql\n`;
    markdown += `  SELECT assignee, COUNT(*) as pending_count FROM "BuddyTask" WHERE status = 'PENDING' GROUP BY assignee;\n`;
    markdown += `  \`\`\`\n`;

    const outputPath = path.join(__dirname, '../../sql_bot.md');
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`Successfully generated schema-based sql_bot.md at ${outputPath}`);

  } catch (err) {
    console.error('Error generating schema reference:', err);
  } finally {
    await client.end();
  }
}

generateSchemaReference();��ีประโยชน์และช่วยให้เข้าใจผลิตภัณฑ์/บริการมากขึ้น\n`;
    markdown += `  - \`q2_apply_knowledge\`: นำความรู้ไปปรับประยุกต์ใช้กับการทำงานได้\n`;
    markdown += `  - \`q3_consistency\`: แนวทางปฏิบัติของทั้ง 2 สาขาเป็นไปในทิศทางเดียวกัน\n`;
    markdown += `- **ผลประเมินความเหมาะสม (ระดับความพึงพอใจเป็นข้อความ)**:\n`;
    markdown += `  - \`q4_1_duration_suitability\`: ความเหมาะสมของระยะเวลา (ค่าที่เป็นไปได้: 'น้อยเกินไป', 'มีความเหมาะสม', 'มากเกินไป')\n`;
    markdown += `  - \`q4_2_branches_suitability\`: ความเหมาะสมของจำนวนสาขา (ค่าที่เป็นไปได้: 'น้อยเกินไป', 'มีความเหมาะสม', 'มากเกินไป')\n`;
    markdown += `- **คะแนนประเมินแยกแต่ละสาขา (คะแนน 1 ถึง 4)** (ฟิลด์ที่มีลงท้ายด้วย \`_branch1\` และ \`_branch2\`):\n`;
    markdown += `  - \`q5_clarity_branchX\`: การสอนมีความชัดเจน เป็นลำดับขั้นตอน ไม่สับสน\n`;
    markdown += `  - \`q6_volume_branchX\`: ปริมาณเนื้อหาและงานที่ได้รับเหมาะสม\n`;
    markdown += `  - \`q7_readiness_branchX\`: สาขามีการจัดเตรียมอุปกรณ์หรือเอกสารประกอบสอนพร้อมใช้งาน\n`;
    markdown += `  - \`q8_trainer_knowledge_branchX\`: พี่เลี้ยงมีความรู้ ถ่ายทอดเข้าใจง่าย\n`;
    markdown += `  - \`q9_safety_hygiene_branchX\`: พี่เลี้ยงให้ความสำคัญเรื่องความปลอดภัยและมาตรฐานสุขอนามัย (Food Safety)\n`;
    markdown += `  - \`q10_trainer_care_branchX\`: พี่เลี้ยงใส่ใจ เป็นมิตร และเปิดโอกาสให้ซักถาม\n`;
    markdown += `  - \`q11_atmosphere_branchX\`: บรรยากาศทีมงานในสาขาให้การต้อนรับและสนับสนุน\n`;
    markdown += `- **ข้อเสนอแนะเพิ่มเติม (คำถามปลายเปิด / เป็น Text)**:\n`;
    markdown += `  - \`feedback12_challenging\`: งานส่วนที่เข้าใจยาก/ท้าทายที่สุด\n`;
    markdown += `  - \`feedback13_ideal_setup\`: ความคิดเห็นเรื่องจำนวนวันและสาขาที่เหมาะสม\n`;
    markdown += `  - \`feedback14_impressions\`: สิ่งที่ประทับใจ\n`;
    markdown += `  - \`feedback15_suggestions\`: ข้อเสนอแนะอื่นๆ\n\n`;

    markdown += `--- \n\n`;
    markdown += `## 5. ตัวอย่างการเขียนคำสั่ง SQL (Example SQL Queries for Bot)\n\n`;
    markdown += `- **หาคะแนนเฉลี่ยความพึงพอใจของภาพรวม (q1, q2, q3)**:\n`;
    markdown += `  \`\`\`sql\n`;
    markdown += `  SELECT AVG(q1_benefit) as avg_benefit, AVG(q2_apply_knowledge) as avg_apply, AVG(q3_consistency) as avg_consistency FROM "SurveyResponse";\n`;
    markdown += `  \`\`\`\n\n`;
    markdown += `- **หาจำนวนคนประเมินแยกตามความเหมาะสมของระยะเวลา (q4_1)**:\n`;
    markdown += `  \`\`\`sql\n`;
    markdown += `  SELECT q4_1_duration_suitability, COUNT(*) FROM "SurveyResponse" GROUP BY q4_1_duration_suitability;\n`;
    markdown += `  \`\`\`\n\n`;
    markdown += `- **เปรียบเทียบคะแนนเฉลี่ยความใส่ใจของพี่เลี้ยง (q10) ระหว่างสาขา 1 และสาขา 2 แยกตามรายสาขา**:\n`;
    markdown += `  \`\`\`sql\n`;
    markdown += `  -- คะแนนสาขาที่ 1\n`;
    markdown += `  SELECT branch1 as branch_name, AVG(q10_trainer_care_branch1) as avg_care FROM "SurveyResponse" GROUP BY branch1\n`;
    markdown += `  UNION ALL\n`;
    markdown += `  -- คะแนนสาขาที่ 2\n`;
    markdown += `  SELECT branch2 as branch_name, AVG(q10_trainer_care_branch2) as avg_care FROM "SurveyResponse" GROUP BY branch2;\n`;
    markdown += `  \`\`\`\n`;

    const outputPath = path.join(__dirname, '../../sql_bot.md');
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`Successfully generated schema-based sql_bot.md at ${outputPath}`);

  } catch (err) {
    console.error('Error generating schema reference:', err);
  } finally {
    await client.end();
  }
}

generateSchemaReference();
