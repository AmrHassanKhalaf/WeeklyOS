import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/FocusedDay.tsx');
let content = fs.readFileSync(file, 'utf-8');

// Fix 1: motion.span at line 627
content = content.replace(
  '{formatTime(pomodoroTime)}\\n                    </span>',
  '{formatTime(pomodoroTime)}\\n                    </motion.span>'
);

// Fix 2: Close Left Column <motion.div layout> instead of </div>
content = content.replace(
  '</Button>\\n          </div>\\n        </div>\\n\\n        {/* ── Right Column',
  '</Button>\\n          </div>\\n        </motion.div>\\n\\n        {/* ── Right Column'
);

// Fix 3: Right Column AnimatePresence
const rightColStart = '        {/* ── Right Column (Sidebar) ─────────────────────────────────────── */}\\n        <div className="space-y-6 xl:sticky xl:top-8 self-start">';
const newRightColStart = \`        {/* ── Right Column (Sidebar) ─────────────────────────────────────── */}
        <AnimatePresence>
          {!(isFocusMode && focusLevel === 'minimal') && (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
              exit={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 xl:sticky xl:top-8 self-start"
            >\`;
content = content.replace(rightColStart, newRightColStart);

// Fix 4: Close Right Column AnimatePresence
// Look for the end of the file
const endOfFile = \`          </Card>\\n\\n        </div>\\n\\n      </motion.div>\\n    </AppLayout>\`;
const newEndOfFile = \`          </Card>\\n\\n            </motion.div>\\n          )}\\n        </AnimatePresence>\\n\\n      </motion.div>\\n    </AppLayout>\`;

// Wait, looking at line 1024, the end is:
/*
1024|          </div>
1025|  
1026|        </div>
1027|      </AppLayout>
1028|    )
*/
// The closing </div> on line 1026 is the Right Column or the Main Grid?
// Main Grid is <motion.div layout ...>
// So it should be </motion.div> for the grid.
const endBlock = \`          </Card>\\n\\n        </div>\\n\\n      </div>\\n    </AppLayout>\`;
const newEndBlock = \`          </Card>\\n\\n            </motion.div>\\n          )}\\n        </AnimatePresence>\\n\\n      </motion.div>\\n    </AppLayout>\`;
// Wait, my previous replacement changed the main grid close to </motion.div> ?
// Line 1026 is `        </div>`, meaning my fix-transitions.mjs didn't change the main grid closing tag either!
// Let me just replace the exact end of the file.

content = content.replace(
  /<\/Card>\s*<\/div>\s*<\/div>\s*<\/AppLayout>/,
  \`</Card>\\n\\n            </motion.div>\\n          )}\\n        </AnimatePresence>\\n\\n      </motion.div>\\n    </AppLayout>\`
);
content = content.replace(
  /<\/Card>\s*<\/div>\s*<\/motion.div>\s*<\/AppLayout>/,
  \`</Card>\\n\\n            </motion.div>\\n          )}\\n        </AnimatePresence>\\n\\n      </motion.div>\\n    </AppLayout>\`
);


fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed build errors');
