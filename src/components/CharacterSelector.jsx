// src/components/CharacterSelector.jsx
import React from 'react';
import { characterList } from '../data/characterList';

// URLに ?debug=true が含まれるか判定
const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';

/**
 * 追加プロップ：
 * - maxSelectable: 選べる上限（デフォルト 5）。育成ダイアログでは 1 を指定。
 * - lockedSelectedIds: 「選択済みとして表示し、かつクリック不可」にするID配列。
 *    例）サポート選手ダイアログで育成選手のIDを渡す → グレー＋選択不可で表示。
 */
function CharacterSelector({
  selectedCharacters,
  onSelectCharacter,
  maxSelectable = 5,
  lockedSelectedIds = [],
}) {
  const selectedIds = new Set(selectedCharacters.map((c) => c.id));
  const lockedIdSet = new Set(lockedSelectedIds);

  const nameOnly = (s) => String(s || '').split('【')[0];

  // locked の名前重複もブロック対象に含める
  const lockedNameRoots = new Set(
    characterList
      .filter((c) => lockedIdSet.has(c.id))
      .map((c) => nameOnly(c.name))
  );

  const handleSelect = (character) => {
    const root = nameOnly(character.name);
    const isSelectedByState = selectedIds.has(character.id);
    const isLocked = lockedIdSet.has(character.id);
    const isSameNameSelected = selectedCharacters.some((c) => nameOnly(c.name) === root);
    const isSameNameLocked = lockedNameRoots.has(root);

    if (isLocked) return; // ロックされたIDは完全に操作不可

    if (isSelectedByState) {
      // 既に state 側で選ばれている → 解除
      onSelectCharacter(selectedCharacters.filter((c) => c.id !== character.id));
      return;
    }

    if (selectedCharacters.length >= maxSelectable) {
      alert(`最大${maxSelectable}名まで選択できます`);
      return;
    }
    if (isSameNameSelected || isSameNameLocked) {
      alert('同名キャラは選択できません');
      return;
    }
    onSelectCharacter([...selectedCharacters, character]);
  };

  const handleCopyJSON = () => {
    const json = JSON.stringify(selectedCharacters, null, 2);
    navigator.clipboard.writeText(json);
    alert('JSON形式でコピーしました');
  };

  const handleCopyCSV = () => {
    if (selectedCharacters.length === 0) {
      alert('キャラが選択されていません');
      return;
    }
    const headers = Object.keys(selectedCharacters[0]).join(',');
    const rows = selectedCharacters.map((c) => Object.values(c).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    navigator.clipboard.writeText(csv);
    alert('CSV形式でコピーしました');
  };

  return (
    <div>
      <h2>キャラクター選択（最大{maxSelectable}名、同名不可）</h2>

      {isDebugMode && (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleCopyJSON}>JSONコピー</button>{' '}
          <button onClick={handleCopyCSV}>CSVコピー</button>
        </div>
      )}

      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', listStyle: 'none', padding: 0 }}>
        {characterList.map((character) => {
          const root = nameOnly(character.name);
          const isLocked = lockedIdSet.has(character.id);
          const isSelectedByState = selectedIds.has(character.id);
          const isSelectedVisual = isLocked || isSelectedByState; // 表示上の「選択済み」
          const isSameNameSelected = selectedCharacters.some((c) => nameOnly(c.name) === root);
          const isSameNameLocked = lockedNameRoots.has(root);

          const selectableCapacity = selectedCharacters.length < maxSelectable;
          const isSelectable =
            !isLocked &&
            !isSelectedByState &&
            !isSameNameSelected &&
            !isSameNameLocked &&
            selectableCapacity;

          const title = isLocked
            ? '育成選手のため選択できません'
            : isSelectedByState
            ? '選択済み（クリックで解除）'
            : !selectableCapacity
            ? `最大${maxSelectable}名まで選択できます`
            : isSameNameSelected || isSameNameLocked
            ? '同名キャラは選択できません'
            : '';

          return (
            <li
              key={character.id}
              onClick={() => {
                if (isLocked) return;
                if (isSelectable || isSelectedByState) handleSelect(character);
              }}
              title={title}
              style={{
                position: 'relative',
                border: isSelectedVisual ? '2px solid blue' : '2px solid #ccc',
                borderRadius: '8px',
                padding: '2px',
                cursor: isLocked ? 'not-allowed' : (isSelectable || isSelectedByState) ? 'pointer' : 'not-allowed',
                width: '75px',
                textAlign: 'center',
                opacity: isLocked ? 0.4 : (isSelectable || isSelectedByState) ? 1 : 0.4,
                backgroundColor: isSelectedVisual ? '#e0f0ff' : 'white',
                color: '#000',
              }}
            >
              <img
                src={`/images/${character.id}.png`}
                alt={character.name}
                style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/placeholder.png';
                }}
              />
              <div style={{ fontSize: '10px' }}>{character.name}</div>

              {isLocked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '6px',
                  }}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default CharacterSelector;
