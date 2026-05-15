import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const repoPath = __dirname;
const gitPath = path.join(repoPath, '.git');
const objectsPath = path.join(gitPath, 'objects');
const refsPath = path.join(gitPath, 'refs');
const headsPath = path.join(refsPath, 'heads');

// 创建必要目录
[gitPath, objectsPath, path.join(objectsPath, 'info'), path.join(objectsPath, 'pack'), 
 refsPath, headsPath, path.join(gitPath, 'hooks'), path.join(gitPath, 'info')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 创建HEAD文件
fs.writeFileSync(path.join(gitPath, 'HEAD'), 'ref: refs/heads/main\n');

// 创建config文件
const configContent = `[core]
	repositoryformatversion = 0
	filemode = false
	bare = false
	logallrefupdates = true
	symlinks = false
	ignorecase = true
[remote "origin"]
	url = https://github.com/qkqk666/ant-colony-cognitive-system.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main`;
fs.writeFileSync(path.join(gitPath, 'config'), configContent);

// 创建description文件
fs.writeFileSync(path.join(gitPath, 'description'), '蚁群认知重塑系统 - 多Agent AI流水线\n');

// 创建exclude文件
fs.writeFileSync(path.join(gitPath, 'info', 'exclude'), '# git ls-files --others --exclude-from=.git/info/exclude\n');

// 创建初始提交（空树）
const emptyTreeHash = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const emptyTreePath = path.join(objectsPath, emptyTreeHash.slice(0, 2), emptyTreeHash.slice(2));
if (!fs.existsSync(path.dirname(emptyTreePath))) {
  fs.mkdirSync(path.dirname(emptyTreePath), { recursive: true });
}

// 创建提交对象
const commitContent = `tree ${emptyTreeHash}
author WorkBuddy <workbuddy@example.com> 1736936580 +0800
committer WorkBuddy <workbuddy@example.com> 1736936580 +0800

Initial commit: 蚁群系统完整部署包
`;
const commitHeader = `commit ${commitContent.length}\0`;
const commitData = commitHeader + commitContent;
const commitHash = crypto.createHash('sha1').update(commitData).digest('hex');
const commitPath = path.join(objectsPath, commitHash.slice(0, 2), commitHash.slice(2));
if (!fs.existsSync(path.dirname(commitPath))) {
  fs.mkdirSync(path.dirname(commitPath), { recursive: true });
}
fs.writeFileSync(commitPath, commitData);

// 创建main分支引用
fs.writeFileSync(path.join(headsPath, 'main'), commitHash + '\n');

console.log('✅ Git仓库已初始化');
console.log(`📁 仓库路径: ${repoPath}`);
console.log(`🔗 远程URL: https://github.com/qkqk666/ant-colony-cognitive-system.git`);
console.log(`🌿 分支: main (${commitHash.slice(0, 7)})`);
console.log('\n🎯 下一步：');
console.log('1. 打开 GitHub Desktop');
console.log('2. 点击 File → Add Local Repository');
console.log('3. 选择这个文件夹：' + repoPath);
console.log('4. 点击 "Publish repository" 发布到GitHub');
console.log('\n📝 提交信息: "Initial commit: 蚁群系统完整部署包"');