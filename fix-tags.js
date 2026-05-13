const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/pages/FocusedDay.tsx');
let content = fs.readFileSync(file, 'utf-8');

const search = '<motion.div layoutId="pomodoro-time-box" className="bg-transparent border-transparent"><motion.span layoutId="pomodoro-time-text" className="text-8xl md:text-[140px] font-mono font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">';
const replace = '<motion.div layoutId="pomodoro-time-box" className="bg-transparent border-transparent">\\n                    <motion.span layoutId="pomodoro-time-text" className="text-8xl md:text-[140px] font-mono font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">';

content = content.replace(search, replace);

content = content.replace(
  '{formatTime(pomodoroTime)}\\n                  </span>\\n                </div>',
  '{formatTime(pomodoroTime)}\\n                    </motion.span>\\n                  </motion.div>\\n                </div>'
);

fs.writeFileSync(file, content, 'utf-8');
