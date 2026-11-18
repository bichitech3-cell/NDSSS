import React from 'react';
import { Student } from '../types';
import {
  CLASS_LEVELS,
  ARM_OPTIONS,
  matchesClassAndArmFilter,
  extractArmLetter
} from '../services/classArmFilterService';

export interface ClassArmSelectorBarProps {
  selectedClass: string;
  onSelectClass: (cls: string) => void;
  selectedArm: string;
  onSelectArm: (arm: string) => void;
  students: Student[];
  onBulkSelectArm?: (matchingStudentIds: string[]) => void;
  showBulkSelectButton?: boolean;
}

export const ClassArmSelectorBar: React.FC<ClassArmSelectorBarProps> = ({
  selectedClass,
  onSelectClass,
  selectedArm,
  onSelectArm,
  students,
  onBulkSelectArm,
  showBulkSelectButton = false
}) => {
  // Count matching students for any key
  const getCount = (clsKey: string, armKey: string = 'All') => {
    return students.filter((s) => matchesClassAndArmFilter(s, clsKey, armKey)).length;
  };

  const currentCount = students.filter((s) =>
    matchesClassAndArmFilter(s, selectedClass, selectedArm)
  ).length;

  const handleQuickSelect = (clsKey: string) => {
    onSelectClass(clsKey);
    // If selecting a combined key like "2A", reset arm filter to 'All' so it doesn't conflict
    if (clsKey !== 'All' && clsKey !== 'JSS 1' && clsKey !== 'JSS 2' && clsKey !== 'JSS 3' && !clsKey.startsWith('SSS ') || clsKey.length <= 3) {
      onSelectArm('All');
    }
  };

  const handleBulkCheckCurrentStream = () => {
    if (!onBulkSelectArm) return;
    const matching = students
      .filter((s) => matchesClassAndArmFilter(s, selectedClass, selectedArm))
      .map((s) => s.id);
    onBulkSelectArm(matching);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-md">
      {/* Top Controls: Dropdowns & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <i className="fas fa-filter text-orange-400"></i>
            <span>Filter Stream / Arm:</span>
          </span>

          {/* Class Level Selector */}
          <select
            value={selectedClass}
            onChange={(e) => onSelectClass(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="All">All Classes (JSS 1 - SSS 3)</option>
            <optgroup label="Junior Secondary (A - D Streams)">
              <option value="JSS 1">JSS 1 (All Arms)</option>
              <option value="1A">JSS 1A (Arm A)</option>
              <option value="1B">JSS 1B (Arm B)</option>
              <option value="1C">JSS 1C (Arm C)</option>
              <option value="1D">JSS 1D (Arm D)</option>
              <option value="JSS 2">JSS 2 (All Arms)</option>
              <option value="2A">★ JSS 2A (2A)</option>
              <option value="2B">★ JSS 2B (2B)</option>
              <option value="2C">★ JSS 2C (2C)</option>
              <option value="2D">★ JSS 2D (2D)</option>
              <option value="JSS 3">JSS 3 (All Arms)</option>
              <option value="3A">JSS 3A (3A)</option>
              <option value="3B">JSS 3B (3B)</option>
              <option value="3C">JSS 3C (3C)</option>
              <option value="3D">JSS 3D (3D)</option>
            </optgroup>
            <optgroup label="Senior Secondary (A - D Streams)">
              <option value="SSS 1">SSS 1 (All Arms)</option>
              <option value="SSS 1A">SSS 1A (Science A)</option>
              <option value="SSS 1B">SSS 1B (Science B)</option>
              <option value="SSS 1C">SSS 1C (Commerce)</option>
              <option value="SSS 1D">SSS 1D (Humanities)</option>
              <option value="SSS 2">SSS 2 (All Arms)</option>
              <option value="SSS 2A">SSS 2A (Science A)</option>
              <option value="SSS 2B">SSS 2B (Science B)</option>
              <option value="SSS 2C">SSS 2C (Commerce)</option>
              <option value="SSS 2D">SSS 2D (Humanities)</option>
              <option value="SSS 3">SSS 3 (All Arms)</option>
              <option value="SSS 3A">SSS 3A (Science A)</option>
              <option value="SSS 3B">SSS 3B (Science B)</option>
              <option value="SSS 3C">SSS 3C (Commerce)</option>
              <option value="SSS 3D">SSS 3D (Humanities)</option>
            </optgroup>
          </select>

          {/* Arm Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold px-2">Arm:</span>
            {['All', 'A', 'B', 'C', 'D'].map((arm) => (
              <button
                key={arm}
                type="button"
                onClick={() => onSelectArm(arm)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedArm === arm
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {arm === 'All' ? 'All Arms' : `Arm ${arm}`}
              </button>
            ))}
          </div>
        </div>

        {/* Count Badge & Bulk Selection Action */}
        <div className="flex items-center gap-2">
          <span className="bg-slate-950 border border-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{currentCount} students matching</span>
          </span>

          {showBulkSelectButton && onBulkSelectArm && (
            <button
              type="button"
              onClick={handleBulkCheckCurrentStream}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={`Select all ${currentCount} matching students in checkboxes`}
            >
              <i className="fas fa-check-double text-emerald-200"></i>
              <span>Select All Matching ({currentCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Stream Badges: JSS 2 Highlight (2A, 2B, 2C, 2D) & other cohorts */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        {/* JSS 2 Streams: specifically addressing user request for 2A differently 2B differently... */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide mr-1 flex items-center gap-1">
            <i className="fas fa-layer-group"></i> JSS 2 Cohort:
          </span>
          <button
            type="button"
            onClick={() => handleQuickSelect('JSS 2')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedClass === 'JSS 2' && selectedArm === 'All'
                ? 'bg-amber-600 text-white ring-1 ring-amber-300'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-500 hover:text-white'
            }`}
          >
            All JSS 2 ({getCount('JSS 2')})
          </button>
          {['2A', '2B', '2C', '2D'].map((stream) => {
            const count = getCount(stream);
            const isSelected = selectedClass === stream;
            return (
              <button
                key={stream}
                type="button"
                onClick={() => handleQuickSelect(stream)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/50 ring-2 ring-orange-400/80'
                    : 'bg-slate-950 text-amber-300 border border-amber-900/40 hover:border-amber-500/80 hover:bg-slate-800'
                }`}
                title={`Filter specifically by ${stream} stream (${count} students)`}
              >
                <span>{stream}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Other Junior Streams (1A-1D and 3A-3D) */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">
            JSS 1 & 3:
          </span>
          {['1A', '1B', '1C', '1D', '3A', '3B', '3C', '3D'].map((stream) => {
            const count = getCount(stream);
            const isSelected = selectedClass === stream;
            return (
              <button
                key={stream}
                type="button"
                onClick={() => handleQuickSelect(stream)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-300'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-cyan-500 hover:text-white'
                }`}
              >
                <span>{stream}</span>
                <span className="text-[9px] text-slate-500">({count})</span>
              </button>
            );
          })}

          <span className="text-slate-600 font-mono">|</span>

          {/* SSS 1-3 Quick buttons */}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">
            SSS Arms:
          </span>
          {['SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B', 'SSS 3A', 'SSS 3B'].map((stream) => {
            const count = getCount(stream);
            const isSelected = selectedClass === stream;
            return (
              <button
                key={stream}
                type="button"
                onClick={() => handleQuickSelect(stream)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-emerald-500 hover:text-white'
                }`}
              >
                <span>{stream}</span>
                <span className="text-[9px] text-slate-500">({count})</span>
              </button>
            );
          })}

          {selectedClass !== 'All' && (
            <button
              type="button"
              onClick={() => {
                onSelectClass('All');
                onSelectArm('All');
              }}
              className="px-2 py-0.5 rounded-lg text-[10px] text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition-colors cursor-pointer ml-auto flex items-center gap-1"
            >
              <i className="fas fa-times"></i>
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
