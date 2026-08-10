import React, { useState, useEffect, useRef } from 'react';
import { STUDY_RESOURCE_LINKS } from '../data/studyLinksData';
import { StudyResourceLink } from '../types';
import {
  Link,
  ExternalLink,
  Search,
  Plus,
  Trash2,
  X,
  Globe,
  Check,
  Pencil,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface StudyLinksTabProps {
  onClose?: () => void;
}

export const StudyLinksTab: React.FC<StudyLinksTabProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // Unified links state with localStorage persistence
  const [links, setLinks] = useState<StudyResourceLink[]>(() => {
    if (typeof window !== 'undefined' && localStorage) {
      try {
        const saved = localStorage.getItem('bible_study_resource_links_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return STUDY_RESOURCE_LINKS;
  });

  // Save links to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage) {
      try {
        localStorage.setItem(
          'bible_study_resource_links_v2',
          JSON.stringify(links)
        );
      } catch {}
    }
  }, [links]);

  // Drag-scroll for category bar
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [isCatDragging, setIsCatDragging] = useState(false);
  const [catStartX, setCatStartX] = useState(0);
  const [catScrollLeft, setCatScrollLeft] = useState(0);

  const handleCatMouseDown = (e: React.MouseEvent) => {
    if (!categoriesRef.current) return;
    setIsCatDragging(true);
    setCatStartX(e.pageX - categoriesRef.current.offsetLeft);
    setCatScrollLeft(categoriesRef.current.scrollLeft);
  };

  const handleCatMouseMove = (e: React.MouseEvent) => {
    if (!isCatDragging || !categoriesRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoriesRef.current.offsetLeft;
    const walk = (x - catStartX) * 1.5;
    categoriesRef.current.scrollLeft = catScrollLeft - walk;
  };

  const handleCatMouseUp = () => {
    setIsCatDragging(false);
  };

  // Add Link Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('성서공회');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newBadge, setNewBadge] = useState('나의링크');
  const [newDescription, setNewDescription] = useState('');

  // Edit Link Modal state
  const [editingLink, setEditingLink] = useState<StudyResourceLink | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState('성서공회');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editBadge, setEditBadge] = useState('참고링크');
  const [editDescription, setEditDescription] = useState('');

  const defaultCategories = [
    '전체',
    '성서공회',
    '원어/사전',
    '지리/지도',
    '통독/주석',
    '오디오/미디어',
  ];

  // Dynamically collect categories including custom ones
  const extraCategories = (
    Array.from(new Set(links.map((l) => l.category))) as string[]
  ).filter((cat) => !defaultCategories.includes(cat));

  const categories = [...defaultCategories, ...extraCategories];

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let finalUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const finalCategory =
      newCategory === '직접입력' && newCustomCategory.trim()
        ? newCustomCategory.trim()
        : newCategory;

    const newLink: StudyResourceLink = {
      id: 'link-' + Date.now(),
      title: newTitle.trim(),
      url: finalUrl,
      category: finalCategory,
      badge: newBadge.trim() || '나의링크',
      description: newDescription.trim() || '사용자 추가 참고 링크입니다.',
    };

    setLinks((prev) => [newLink, ...prev]);

    // Reset Form & Close
    setNewTitle('');
    setNewUrl('');
    setNewBadge('나의링크');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (link: StudyResourceLink) => {
    setEditingLink(link);
    setEditTitle(link.title);
    setEditUrl(link.url);
    const catStr = link.category as string;
    const isStandardCat = defaultCategories.includes(catStr) && catStr !== '전체';
    if (isStandardCat) {
      setEditCategory(catStr);
      setEditCustomCategory('');
    } else {
      setEditCategory('직접입력');
      setEditCustomCategory(catStr);
    }
    setEditBadge(link.badge);
    setEditDescription(link.description);
  };

  const handleSaveEditLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink || !editTitle.trim() || !editUrl.trim()) return;

    let finalUrl = editUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const finalCategory =
      editCategory === '직접입력' && editCustomCategory.trim()
        ? editCustomCategory.trim()
        : editCategory;

    const updatedLink: StudyResourceLink = {
      ...editingLink,
      title: editTitle.trim(),
      url: finalUrl,
      category: finalCategory,
      badge: editBadge.trim() || '참고링크',
      description: editDescription.trim(),
    };

    setLinks((prev) =>
      prev.map((item) => (item.id === editingLink.id ? updatedLink : item))
    );

    setEditingLink(null);
  };

  const handleDeleteLink = (id: string, _title: string) => {
    setLinks((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetDefaultLinks = () => {
    setLinks(STUDY_RESOURCE_LINKS);
    setSelectedCategory('전체');
  };

  const handleMoveLink = (id: string, direction: 'up' | 'down') => {
    setLinks((prev) => {
      const currentFiltered = prev.filter((item) => {
        const matchesCat =
          selectedCategory === '전체' || item.category === selectedCategory;
        const matchesSearch =
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.badge.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
      });

      const filterIdx = currentFiltered.findIndex((item) => item.id === id);
      if (filterIdx === -1) return prev;

      const targetFilterIdx = direction === 'up' ? filterIdx - 1 : filterIdx + 1;
      if (targetFilterIdx < 0 || targetFilterIdx >= currentFiltered.length) return prev;

      const targetItem = currentFiltered[targetFilterIdx];
      const realIdx1 = prev.findIndex((item) => item.id === id);
      const realIdx2 = prev.findIndex((item) => item.id === targetItem.id);

      if (realIdx1 === -1 || realIdx2 === -1) return prev;

      const next = [...prev];
      const temp = next[realIdx1];
      next[realIdx1] = next[realIdx2];
      next[realIdx2] = temp;
      return next;
    });
  };

  const filteredLinks = links.filter((item) => {
    const matchesCat =
      selectedCategory === '전체' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
        <div className="pr-10 sm:pr-0">
          <div className="flex items-center gap-2 mb-1">
            <Link className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <h2 className="text-base sm:text-2xl font-extrabold font-serif whitespace-nowrap">
              성경 연구 참고 링크
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-100">
            대한성서공회, 원어 분석, 성경 지리, 통독 전문 기관 및 나만의 추천 사이트를 자유롭게 관리하세요.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-8 sm:pr-0">
          <button
            onClick={handleResetDefaultLinks}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-700/60 hover:bg-amber-700 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
            title="기본 링크 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">기본 복원</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-amber-800 hover:bg-amber-50 text-xs font-extrabold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span>새 링크 추가</span>
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-black/20 hover:bg-black/30 active:scale-95 text-white transition-all cursor-pointer border border-white/20 flex items-center justify-center shadow-xs"
            title="창 닫기"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills - Wrap on Mobile, Drag Scrollable on Desktop */}
        <div
          ref={categoriesRef}
          onMouseDown={handleCatMouseDown}
          onMouseMove={handleCatMouseMove}
          onMouseUp={handleCatMouseUp}
          onMouseLeave={handleCatMouseUp}
          className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1.5 select-none touch-pan-x [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-amber-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="연구 사이트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Grid List */}
      {filteredLinks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Globe className="w-10 h-10 text-zinc-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            검색되거나 등록된 연구 링크가 없습니다.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
            >
              새 링크 직접 추가하기
            </button>
            <button
              onClick={handleResetDefaultLinks}
              className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-300 transition-colors cursor-pointer"
            >
              기본 링크 전체 복원
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredLinks.length - 1;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/80 hover:shadow-md transition-all group flex flex-col justify-between relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                      {item.badge}
                    </span>

                    {/* Controls: Move Up, Move Down, Edit, Delete, External */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveLink(item.id, 'up')}
                        disabled={isFirst}
                        className={`p-1 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                          isFirst ? 'opacity-20 cursor-not-allowed' : ''
                        }`}
                        title="위로 이동"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleMoveLink(item.id, 'down')}
                        disabled={isLast}
                        className={`p-1 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                          isLast ? 'opacity-20 cursor-not-allowed' : ''
                        }`}
                        title="아래로 이동"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                        title="수정하기"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteLink(item.id, item.title)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="삭제하기"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-zinc-400 hover:text-amber-500 transition-colors ml-0.5"
                        title="새 창에서 열기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {item.title}
                    </a>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span className="truncate max-w-[170px]">{item.url}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline shrink-0 ml-2"
                  >
                    바로가기 →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Link Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg">새 참고 사이트 링크 추가</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLink} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  사이트/자료 제목 <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 나의 교구 사이트, 원어 연구 블로그"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  웹사이트 URL 주소 <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    분류 카테고리
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="성서공회">성서공회</option>
                    <option value="원어/사전">원어/사전</option>
                    <option value="지리/지도">지리/지도</option>
                    <option value="통독/주석">통독/주석</option>
                    <option value="오디오/미디어">오디오/미디어</option>
                    <option value="개인추천">개인추천</option>
                    <option value="직접입력">+ 직접입력</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    배지/태그 명칭
                  </label>
                  <input
                    type="text"
                    placeholder="예: 나의추가"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {newCategory === '직접입력' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    새 카테고리 이름 입력
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 찬양/음악"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  설명 요약 (선택사항)
                </label>
                <textarea
                  rows={2}
                  placeholder="사이트에 대한 간략한 연관 설명..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>링크 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg">참고 사이트 링크 수정</h3>
              </div>
              <button
                onClick={() => setEditingLink(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLink} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  사이트/자료 제목 <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  웹사이트 URL 주소 <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    분류 카테고리
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="성서공회">성서공회</option>
                    <option value="원어/사전">원어/사전</option>
                    <option value="지리/지도">지리/지도</option>
                    <option value="통독/주석">통독/주석</option>
                    <option value="오디오/미디어">오디오/미디어</option>
                    <option value="개인추천">개인추천</option>
                    <option value="직접입력">+ 직접입력</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    배지/태그 명칭
                  </label>
                  <input
                    type="text"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {editCategory === '직접입력' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    카테고리 이름 입력
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 찬양/음악"
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  설명 요약
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>변경사항 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

