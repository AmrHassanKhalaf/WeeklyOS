import re
import os

file_path = os.path.join(os.getcwd(), 'src', 'pages', 'FocusedDay.tsx')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: span -> motion.span
# 625|                      <motion.span layoutId="pomodoro-time-text" className="text-6xl md:text-7xl font-mono font-black text-on-surface tabular-nums tracking-tight leading-none">
# 626|                        {formatTime(pomodoroTime)}
# 627|                      </span>
content = re.sub(
    r'(<motion\.span layoutId="pomodoro-time-text".*?>\s*\{formatTime\(pomodoroTime\)\}\s*)</span>',
    r'\1</motion.span>',
    content,
    flags=re.DOTALL
)

# Fix 2: </div> -> </motion.div> for the left column
# 953|            </div>
# 954|          </div>
# 955|  
# 956|          {/* ── Right Column (Sidebar) ─────────────────────────────────────── */}
content = re.sub(
    r'(</Button>\s*</div>\s*)</div>(\s*\{\/\*\s*──\s*Right Column)',
    r'\1</motion.div>\2',
    content,
    flags=re.DOTALL
)

# Fix 3: </div> -> </motion.div> for the main layout grid
# 1024|          </div>
# 1025|  
# 1026|        </div>
# 1027|      </AppLayout>
content = re.sub(
    r'</div>(\s*</AppLayout>)',
    r'</motion.div>\1',
    content,
    flags=re.DOTALL
)

# Fix 4: Add AnimatePresence to Right Column
#        {/* ── Right Column (Sidebar) ─────────────────────────────────────── */}
#        <div className="space-y-6 xl:sticky xl:top-8 self-start">
content = re.sub(
    r'(\{\/\*\s*──\s*Right Column.*?\}\s*)<div className="space-y-6 xl:sticky xl:top-8 self-start">',
    r'\1<AnimatePresence>\n          {!(isFocusMode && focusLevel === \'minimal\') && (\n            <motion.div\n              initial={{ opacity: 0, filter: \'blur(10px)\', x: 20 }}\n              animate={{ opacity: 1, filter: \'blur(0px)\', x: 0 }}\n              exit={{ opacity: 0, filter: \'blur(10px)\', x: 20 }}\n              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}\n              className="space-y-6 xl:sticky xl:top-8 self-start"\n            >',
    content,
    flags=re.DOTALL
)

# And close AnimatePresence at the very end of the Right Column
#           </Card>
#
#        </motion.div>
#      </motion.div>
#    </AppLayout>
content = re.sub(
    r'(</Card>\s*)</motion.div>(\s*</motion.div>\s*</AppLayout>)',
    r'\1  </motion.div>\n          )}\n        </AnimatePresence>\2',
    content,
    flags=re.DOTALL
)

# Let's handle the case if it's still </div> instead of </motion.div> from my earlier un-replaced script
content = re.sub(
    r'(</Card>\s*)</div>(\s*</motion.div>\s*</AppLayout>)',
    r'\1  </motion.div>\n          )}\n        </AnimatePresence>\2',
    content,
    flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Python script fixed syntax errors")
