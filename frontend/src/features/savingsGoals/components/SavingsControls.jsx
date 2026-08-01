export default function SavingsControls({ activeTab, onTabChange, onAddGoal }) {
  return (
    <div className="savings-controls">
      <div className="savings-pill-group">
        <button
          onClick={() => onTabChange('Selected Month')}
          className={"savings-pill" + (activeTab === 'Selected Month' ? ' active' : '')}
        >
          Selected Month
        </button>
        <button
          onClick={() => onTabChange('All Time')}
          className={"savings-pill" + (activeTab === 'All Time' ? ' active' : '')}
        >
          All Time
        </button>
        <button
          onClick={() => onTabChange('Summary')}
          className={"savings-pill" + (activeTab === 'Summary' ? ' active' : '')}
        >
          Summary
        </button>
      </div>

      <div className="savings-controls-right">
        <button className="savings-add-button" onClick={onAddGoal}>
          + Add Saving Goal
        </button>
      </div>
    </div>
  );
}
