/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Tag as TagIcon, 
  X, 
  ChevronRight, 
  Clock,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Note = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
};

const STORAGE_KEY = "mymemo.notes";

const INITIAL_NOTES: Note[] = [
  {
    id: 1,
    title: "시안 작업 가이드",
    body: "디자인 시안을 작업할 때는 그리드 시스템을 준수하고, 컬러 팔레트는 브랜드 가이드를 따르세요.",
    tags: ["디자인", "가이드"],
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "읽어야 할 책 리스트",
    body: "클린 코드, 리팩터링, 디자인 패턴에 관한 서적들을 우선적으로 읽어보세요.",
    tags: ["독서", "자기개발"],
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "프로젝트 아이디어",
    body: "개인화된 대시보드를 제공하는 생산성 도구 프로젝트를 기획해보면 좋을 것 같습니다.",
    tags: ["업무", "개발"],
    updatedAt: new Date().toISOString()
  }
];

export default function App() {
  // --- State ---
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Modal form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formTags, setFormTags] = useState("");

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // --- Helpers ---
  const tagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesTag = activeTag ? note.tags.includes(activeTag) : true;
      const matchesSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesTag && matchesSearch;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, activeTag, searchQuery]);

  // --- Actions ---
  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormTitle(note.title);
      setFormBody(note.body);
      setFormTags(note.tags.join(", "));
    } else {
      setEditingNote(null);
      setFormTitle("");
      setFormBody("");
      setFormTags("");
    }
    setIsModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!formTitle.trim()) return;

    const tags = formTags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag !== "");

    const newNote: Note = {
      id: editingNote ? editingNote.id : Date.now(),
      title: formTitle,
      body: formBody,
      tags,
      updatedAt: new Date().toISOString(),
    };

    if (editingNote) {
      setNotes(prev => prev.map(n => n.id === editingNote.id ? newNote : n));
    } else {
      setNotes(prev => [newNote, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteNote = (id: number) => {
    if (window.confirm("정말로 이 메모를 삭제하시겠습니까?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg font-black italic shadow-lg shadow-indigo-100">
              M
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">MyMemo</h1>
          </div>

          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="메모 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-full px-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              id="memo-search"
            />
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 min-w-max"
            id="new-memo-btn"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>새 메모 추가</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div>
              <div className="px-3 py-2">
                <button 
                  onClick={() => setActiveTag(null)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${activeTag === null ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="w-4.5 h-4.5" />
                    전체 메모
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTag === null ? 'bg-indigo-100' : 'bg-slate-100 text-slate-400'}`}>{notes.length}</span>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <h2 className="px-6 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">태그 목록</h2>
              <div className="space-y-0.5 px-3">
                {tagsWithCounts.map(([tag, count]) => (
                  <button 
                    key={tag}
                    onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTag === tag ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className={activeTag === tag ? 'text-indigo-500' : 'text-slate-400'}>#</span>
                      {tag}
                    </span>
                    <span className={`text-[10px] ${activeTag === tag ? 'text-indigo-400' : 'text-slate-400'}`}>{count}</span>
                  </button>
                ))}
                {tagsWithCounts.length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-400 italic">태그가 없습니다.</p>
                )}
              </div>
            </div>
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-tighter">Storage Status</div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500" 
                  style={{ width: `${Math.min((notes.length / 50) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="mt-1 text-[10px] text-slate-500 flex justify-between">
                <span>{notes.length} / 50 메모</span>
                <span>{Math.round((notes.length / 50) * 100)}%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex items-baseline justify-between">
              <h2 className="text-2xl font-bold text-slate-800">
                {activeTag ? (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium text-lg">태그:</span>
                    {activeTag}
                  </span>
                ) : (
                  "내 메모"
                )}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredNotes.length} Notes</p>
            </div>

            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr"
            >
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  whileHover={{ y: -4 }}
                  className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer"
                  onClick={() => handleOpenModal(note)}
                  id={`note-card-${note.id}`}
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col h-full">
                    <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors pr-6">
                      {note.title}
                    </h3>
                    <p className="text-sm text-slate-500 flex-1 line-clamp-3 mb-4 leading-relaxed">
                      {note.body}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {note.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-bold uppercase tracking-tighter"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredNotes.length === 0 && (
              <div className="col-span-full py-20 bg-indigo-50/30 border border-dashed border-indigo-100 rounded-3xl flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-indigo-200 shadow-sm">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">메모를 찾을 수 없습니다</h3>
                <p className="text-sm text-slate-500">다른 검색어나 태그로 시도해보세요.</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>

      {/* Note Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-8 py-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingNote ? "메모 수정" : "새 메모 작성"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-8 pb-8 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">제목</label>
                  <input 
                    id="title"
                    type="text" 
                    placeholder="메모 제목을 입력하세요"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg text-slate-800 transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="body" className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">본문</label>
                  <textarea 
                    id="body"
                    placeholder="내용을 작성하세요..."
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 h-40 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm text-slate-600 leading-relaxed"
                  />
                </div>

                <div>
                  <label htmlFor="tags" className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">태그</label>
                  <input 
                    id="tags"
                    type="text" 
                    placeholder="쉼표로 구분 (예: 디자인, 가이드)"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600 transition-all font-medium"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleSaveNote}
                    disabled={!formTitle.trim()}
                    className="flex-1 py-3 bg-indigo-600 disabled:bg-slate-200 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Float Mobile Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => handleOpenModal()}
          className="w-14 h-14 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <Plus className="w-8 h-8 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
