const fs = require('node:fs');
const path = require('node:path');

const suppliedRootIndex = process.argv.indexOf('--project-root');
const projectRoot = suppliedRootIndex >= 0
  ? path.resolve(process.argv[suppliedRootIndex + 1])
  : path.resolve(__dirname, '..');
const sourceRoot = path.resolve(projectRoot, '..');
const libraryRoot = path.join(projectRoot, 'content', 'student-library');
const assetRoot = path.join(libraryRoot, 'assets');
const publicMaterialRoot = path.join(projectRoot, 'public', 'student-materials');
const toolImageRoot = path.join(projectRoot, 'public', 'tool-images');

for (const directory of [libraryRoot, assetRoot, publicMaterialRoot, toolImageRoot]) {
  fs.mkdirSync(directory, { recursive: true });
}

function sourceFile(relativePath) {
  const file = path.join(sourceRoot, relativePath);
  if (!fs.existsSync(file)) throw new Error(`Missing source file: ${file}`);
  return file;
}
function copy(relativeSource, destination) {
  fs.copyFileSync(sourceFile(relativeSource), destination);
}

const markdownCopies = [
  ['class 1/class1 .md', 'class01-ai-detective.md'],
  ['class 8/学生任务单_我的第一个会判断的Agent.md', 'class08-first-agent.md'],
  ['class 9/Class9_课堂内容_我的问题去云端旅行.md', 'class09-cloud-workflow.md'],
  ['class 10/Class10前置模块_MakeCode熟悉与ML4Kids趣味示例.md', 'class10-makecode-ml-intro.md'],
  ['class 10/Class10_联机Minecraft课程_云社区智能修复队.md', 'class10-minecraft-repair.md'],
  ['新班进阶课程路线_从神经网络到Agent与VibeCoding.md', 'course-roadmap.md']
];
for (const [source, target] of markdownCopies) copy(source, path.join(libraryRoot, target));

let class7 = fs.readFileSync(sourceFile('class 7/Class7学生复习讲义.md'), 'utf8');
class7 = class7.replace(/^!\[image-[^\]]*\]\([^\r\n]*\)\s*\r?\n/m, '');
class7 = class7.replaceAll('人脸关键点作品示例.png', 'assets/class7-face-landmarks.png');
fs.writeFileSync(path.join(libraryRoot, 'class07-vision-and-cloud.md'), class7, 'utf8');

const repairFile = path.join(libraryRoot, 'class10-minecraft-repair.md');
let repair = fs.readFileSync(repairFile, 'utf8');
repair = repair.replaceAll('./Class10前置模块_MakeCode熟悉与ML4Kids趣味示例.md', './class10-makecode-ml-intro.md');
fs.writeFileSync(repairFile, repair, 'utf8');

const binaryCopies = [
  ['class 7/人脸关键点作品示例.png', path.join(assetRoot, 'class7-face-landmarks.png')],
  ['output/pdf/AIxAgentxMinecraftEducation_第一课_五年级学生版.pdf', path.join(publicMaterialRoot, 'class01-ai-first-lesson.pdf')],
  ['output/pdf/Class8_AI模型训练与Minecraft数据中心_复习笔记.pdf', path.join(publicMaterialRoot, 'class08-ai-and-minecraft-review.pdf')],
  ['output/pdf/Class9_课堂回顾与课后练习.pdf', path.join(publicMaterialRoot, 'class09-review-and-homework.pdf')],
  ['output/pdf/Minecraft_Education_数据中心与JavaScript自动建造_课堂文档.pdf', path.join(publicMaterialRoot, 'minecraft-data-center-and-js.pdf')],
  ['output/class3/AIxAgentxMinecraftEducation_2026-09-27_基础版_复习笔记.pdf', path.join(publicMaterialRoot, 'minecraft-agent-review.pdf')],
  ['output/class3/AIxAgentxMinecraftEducation_2026-09-27_基础版_课后作业.pdf', path.join(publicMaterialRoot, 'minecraft-agent-homework.pdf')],
  ['output/class3/AIxAgentxMinecraftEducation_2026-09-27_基础版_复习笔记.docx', path.join(publicMaterialRoot, 'minecraft-agent-review-editable.docx')],
  ['output/class3/AIxAgentxMinecraftEducation_2026-09-27_基础版_课后作业.docx', path.join(publicMaterialRoot, 'minecraft-agent-homework-editable.docx')],
  ['assets/class3/basic_playground_example.png', path.join(toolImageRoot, 'tensorflow-playground.png')],
  ['class 8/assets/class8_user_pokemon_scratch.png', path.join(toolImageRoot, 'ml4kids-scratch.png')],
  ['class 9/assets/MakeCode示例列表.png', path.join(toolImageRoot, 'makecode-minecraft.png')]
];
for (const [source, target] of binaryCopies) copy(source, target);

console.log(`Student-facing materials imported to: ${libraryRoot}`);
console.log(`Public PDFs and tool images imported to: ${publicMaterialRoot}`);
