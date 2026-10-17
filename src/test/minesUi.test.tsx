import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MinesAnalyzer } from '../components/MinesAnalyzer';
import { clearAllMinesRounds } from '../db/minesStorage';

describe('Mines 5x5 UI Workflow and Model-Driven Analysis', () => {
  beforeEach(async () => {
    await clearAllMinesRounds();
    localStorage.clear();
  });

  it('Renders 5x5 prediction grid with 25 numbered tiles and model dashboard controls', async () => {
    render(<MinesAnalyzer />);

    // Check header
    expect(screen.getByText('Mines 5×5 AI Prediction & Probability Engine')).toBeInTheDocument();

    // Check 25 tile grid exists
    const grid = screen.getByRole('grid', { name: /5x5 Mines Tile Grid/i });
    expect(grid).toBeInTheDocument();

    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBe(25);

    // Initial safe probability for 3 bombs, 3 picks: C(22,3)/C(25,3) = 66.96%
    expect(screen.getByText('66.96%')).toBeInTheDocument();

    // Check un-prefilled bankroll input is present
    const bankrollInput = screen.getByPlaceholderText('Starting Balance');
    expect(bankrollInput).toBeInTheDocument();
    expect((bankrollInput as HTMLInputElement).value).toBe('');

    // Check history section exists
    expect(screen.getByText('Round History')).toBeInTheDocument();
  });

  it('Initializing paper bankroll enables live balance and target tracking', async () => {
    render(<MinesAnalyzer />);

    const bankrollInput = screen.getByPlaceholderText('Starting Balance');
    fireEvent.change(bankrollInput, { target: { value: '250' } });

    const startBtn = screen.getByRole('button', { name: /Start Simulator/i });
    fireEvent.click(startBtn);

    // Balance should now display $250.00
    expect(screen.getByText('$250.00')).toBeInTheDocument();

    // Target (+10%) should display $275.00
    expect(screen.getByText('$275.00')).toBeInTheDocument();
  });

  it('Main Workflow: Model generates prediction and displays suggested coordinates without gameplay clicking', async () => {
    render(<MinesAnalyzer />);

    // Bomb selector exists
    const bombSelect = screen.getByLabelText(/Bomb count selector/i);
    expect(bombSelect).toBeInTheDocument();
    fireEvent.change(bombSelect, { target: { value: '4' } });

    // Pick selector exists
    const pickSelect = screen.getByLabelText(/Picks count selector/i);
    expect(pickSelect).toBeInTheDocument();
    fireEvent.change(pickSelect, { target: { value: '2' } });

    // Click GENERATE NEW ANALYSIS
    const generateBtn = screen.getByRole('button', { name: /GENERATE NEW ANALYSIS/i });
    expect(generateBtn).toBeInTheDocument();
    fireEvent.click(generateBtn);

    // Theoretical probability for 4 bombs, 2 picks = C(21, 2) / C(25, 2) = 210 / 300 = 70.00%
    await waitFor(() => {
      expect(screen.getByText('70.00%')).toBeInTheDocument();
    });

    // Check that suggested tiles tag "PICK" appears in the grid
    const pickBadges = screen.getAllByText('PICK');
    expect(pickBadges.length).toBe(2);

    // Check Record Actual Outcome button opens the evaluation modal
    const recordBtn = screen.getByRole('button', { name: /Record Actual Outcome/i });
    fireEvent.click(recordBtn);

    expect(screen.getByText('Record Observed Round Manually')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Spribe / BetInExchange247')).toBeInTheDocument();
  });

  it('Advanced statistics accordion expands and displays sub-tabs and honesty guides', async () => {
    render(<MinesAnalyzer />);

    const expandBtn = screen.getByRole('button', { name: /Advanced Statistical Assessment/i });
    expect(expandBtn).toBeInTheDocument();

    // Expand
    fireEvent.click(expandBtn);

    // Check that Chi-square test is rendered
    expect(
      await screen.findByText(/Pearson's Chi-Square Goodness-of-Fit Test/i)
    ).toBeInTheDocument();

    // Click Multiplier Schedule sub-tab
    const multiplierTab = screen.getByRole('button', { name: /Multiplier Schedule & House Edge/i });
    fireEvent.click(multiplierTab);
    expect(screen.getByText(/Configured for 3 bomb/i)).toBeInTheDocument();

    // Click Provably Fair Verifier sub-tab
    const pfTab = screen.getByRole('button', { name: /Provably Fair Verifier/i });
    fireEvent.click(pfTab);
    expect(screen.getByText(/Cryptographic Provably Fair Verifier/i)).toBeInTheDocument();
  });

  it('User can click tile 7 on grid to report bomb location and train model', async () => {
    render(<MinesAnalyzer />);

    // Find Tile 7 (index 6)
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBe(25);
    const tile7 = cells[6];
    fireEvent.click(tile7);

    // Should display marked bomb notice and Save button
    expect(screen.getByText(/Marked Bomb: Tile 7/i)).toBeInTheDocument();
    const saveBtn = screen.getByRole('button', { name: /Save Outcome & Train Model/i });
    expect(saveBtn).toBeInTheDocument();

    // Click Save Outcome & Train Model
    fireEvent.click(saveBtn);

    // Verify observation recorded message appears
    await waitFor(() => {
      expect(screen.getByText(/Observation recorded!/i)).toBeInTheDocument();
    });
  });
});
