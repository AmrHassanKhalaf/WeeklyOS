import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/FocusedDay.tsx');
let content = fs.readFileSync(file, 'utf-8');

const regex = /<motion\.div layoutId="pomodoro-time-box" className="bg-transparent border-transparent"><motion\.span layoutId="pomodoro-time-text" className="text-8xl md:text-\[140px\] font-mono font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-\[0_0_40px_rgba\(255,255,255,0\.15\)\]">\s*\{formatTime\(pomodoroTime\)\}\s*<\/span>\s*<\/div>/g;

const replacement = `<motion.div layoutId="pomodoro-time-box" className="bg-transparent border-transparent">
                    <motion.span layoutId="pomodoro-time-text" className="text-8xl md:text-[140px] font-mono font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                      {formatTime(pomodoroTime)}
                    </motion.span>
                  </motion.div>
                </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed tags');
