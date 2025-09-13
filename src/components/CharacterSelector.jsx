// src/components/CharacterSelector.jsx
import React from 'react';
import { characterList } from '../data/characterList';

// URLに ?debug=true が含まれるか判定
const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';

function CharacterSelector({ selectedCharacters, onSelectCharacter }) {
  const handleSelect = (character) => {
    const nameOnly = character.name.split('【')[0];
    const alreadySelectedNames = selectedCharacters.map((c) => c.name.split('【')[0]);
    const isAlreadySelectedSameName = alreadySelectedNames.includes(nameOnly);
    const isAlreadySelectedSameId = selectedCharacters.some((c) => c.id === character.id);

    if (isAlreadySelectedSameId) {
      onSelectCharacter(selectedCharacters.filter((c) => c.id !== character.id));
    } else {
      if (selectedCharacters.length >= 5) {
        alert('最大5名まで選択できます');
        return;
      }
      if (isAlreadySelectedSameName) {
        alert('同名キャラは選択できません');
        return;
      }
      onSelectCharacter([...selectedCharacters, character]);
    }
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
      <h2>キャラクター選択（最大5名、同名不可）</h2>

      {isDebugMode && (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleCopyJSON}>JSONコピー</button>{' '}
          <button onClick={handleCopyCSV}>CSVコピー</button>
        </div>
      )}

      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', listStyle: 'none', padding: 0 }}>
        {characterList.map((character) => {
          const isSelected = selectedCharacters.some((c) => c.id === character.id);
          const nameOnly = character.name.split('【')[0];
          const isSameNameSelected = selectedCharacters.some((c) => c.name.split('【')[0] === nameOnly);
          const isSelectable = !isSelected && !isSameNameSelected && selectedCharacters.length < 5;

          return (
            <li
              key={character.id}
              onClick={() => {
                if (isSelectable || isSelected) handleSelect(character);
              }}
              title={
                isSelected
                  ? '選択済み'
                  : !isSelectable && isSameNameSelected
                  ? '同名キャラは選択できません'
                  : selectedCharacters.length >= 5
                  ? '最大5名まで選択できます'
                  : ''
              }
              style={{
                border: isSelected ? '2px solid blue' : '2px solid #ccc',
                borderRadius: '8px',
                padding: '2px',
                cursor: isSelectable || isSelected ? 'pointer' : 'not-allowed',
                width: '75px',
                textAlign: 'center',
                opacity: isSelectable || isSelected ? 1 : 0.4,
                backgroundColor: isSelected ? '#e0f0ff' : 'white',
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default CharacterSelector;
