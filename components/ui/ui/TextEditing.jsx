import React from 'react';

export const TextEditing = ({
  editingTextId,
  editingScreenPos,
  textareaRef,
  textValue,
  setTextValue,
  selectedTextRange,
  setSelectedTextRange,
  showCommandMenu,
  setShowCommandMenu,
  commandMenuPos,
  setCommandMenuPos,
  camera,
  isEditingText,
  elements,
  setElements,
  parseQuickDate,
  setEditingTextId
}) => {
  if (!editingTextId || !editingScreenPos) return null;

  const editingElement = elements.find(el => el.id === editingTextId);
  if (!editingElement) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
      {/* Textarea Container */}
      <div
        style={{
          position: 'fixed',
          left: `${editingScreenPos.x}px`,
          top: `${editingScreenPos.y}px`,
          width: `${editingScreenPos.width}px`,
          height: `${editingScreenPos.height}px`,
          zIndex: 10000,
          pointerEvents: 'auto'
        }}
      >
        <textarea
          ref={textareaRef}
          autoFocus
          value={textValue}
          onFocus={() => {
            isEditingText.current = true;
          }}
          onChange={(e) => {
            setTextValue(e.target.value);
            if (e.target.value.endsWith('/')) {
              setShowCommandMenu(true);
              setCommandMenuPos({ x: e.target.selectionStart, y: 20 });
            } else {
              setShowCommandMenu(false);
            }
          }}
          onMouseUp={(e) => {
            if (textareaRef.current) {
              const start = textareaRef.current.selectionStart;
              const end = textareaRef.current.selectionEnd;
              if (start !== end) {
                setSelectedTextRange({ start, end, text: textValue.slice(start, end) });
              } else {
                setSelectedTextRange(null);
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              isEditingText.current = false;
              setShowCommandMenu(false);
              textareaRef.current?.blur();
            }
            if ((e.key === ' ' || e.key === 'Enter') && textareaRef.current) {
              const cursorPos = textareaRef.current.selectionStart;
              const textBefore = textValue.substring(0, cursorPos);
              const words = textBefore.trim().split(/\s+/);
              const lastWord = words[words.length - 1] || '';
              
              let dateStr = null;
              if (words.length >= 1) {
                const lastTwo = words.slice(-2).join(' ');
                if (parseQuickDate(lastTwo)) {
                  dateStr = parseQuickDate(lastTwo);
                  setTextValue(textValue.substring(0, cursorPos - lastTwo.length) + dateStr);
                } else if (parseQuickDate(lastWord)) {
                  dateStr = parseQuickDate(lastWord);
                  setTextValue(textValue.substring(0, cursorPos - lastWord.length) + dateStr);
                }
              }
            }
          }}
          onBlur={(e) => {
            isEditingText.current = false;
            const finalText = textValue;
            setElements(prev => prev.map(el =>
              el.id === editingTextId ? { ...el, text: finalText, isEditing: false } : el
            ));
            setEditingTextId(null);
            setTextValue('');
            setSelectedTextRange(null);
            setShowCommandMenu(false);
            setCommandMenuPos(null);
          }}
          style={{
            width: '100%',
            height: '100%',
            border: '3px solid #3b82f6',
            padding: '10px',
            resize: 'none',
            outline: 'none',
            fontSize: `${18 * camera.zoom}px`,
            fontFamily: 'sans-serif',
            backgroundColor: '#ffffff',
            color: '#000000',
            boxSizing: 'border-box',
            zIndex: 10001,
            position: 'relative'
          }}
        />
      </div>
      
      {/* Text Highlight Palette */}
      {editingTextId && selectedTextRange && (
        <div
          style={{
            position: 'fixed',
            left: `${editingScreenPos.x + 10}px`,
            top: `${editingScreenPos.y - 50}px`,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 4px',
            display: 'flex',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10002
          }}
        >
          {[
            { name: 'Yellow', color: '#fef08a', bg: '#fbbf24' },
            { name: 'Blue', color: '#bfdbfe', bg: '#3b82f6' },
            { name: 'Green', color: '#bbf7d0', bg: '#10b981' }
          ].map(({ name, color, bg }) => (
            <button
              key={name}
              onClick={() => {
                const before = textValue.substring(0, selectedTextRange.start);
                const selected = selectedTextRange.text;
                const after = textValue.substring(selectedTextRange.end);
                const highlighted = `${selected}`;
                setTextValue(before + highlighted + after);
                setSelectedTextRange(null);
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                border: '2px solid ' + bg,
                backgroundColor: color,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={name}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          ))}
        </div>
      )}
      
      {/* Command Menu */}
      {editingTextId && showCommandMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${editingScreenPos.x + (commandMenuPos?.x ?? 20)}px`,
            top: `${editingScreenPos.y + (commandMenuPos?.y ?? 40)}px`,
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 10002,
            minWidth: '200px'
          }}
        >
          {[
            { icon: '# ', label: 'Heading', insert: '\n# ' },
            { icon: '☐ ', label: 'Checklist', insert: '\n☐ ' },
            { icon: '─ ', label: 'Divider', insert: '\n─────\n' },
            { icon: '📅 ', label: 'Date', insert: '\n' + new Date().toLocaleDateString() },
            { icon: '✏️ ', label: 'Sketch', insert: '\n[Sketch]\n' }
          ].map(({ icon, label, insert }) => (
            <button
              key={label}
              onClick={() => {
                const newText = textValue.replace(/\/$/, '') + insert;
                setTextValue(newText);
                setShowCommandMenu(false);
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s',
                borderBottom: '1px solid #f3f4f6',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontWeight: 600, marginRight: '8px' }}>{icon}</span>{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
