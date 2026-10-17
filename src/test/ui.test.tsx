import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { clearAllDatabaseData } from '../db/storage';

describe('Test 20: UI Workflow & Responsiveness', () => {
  beforeEach(async () => {
    await clearAllDatabaseData();
  });

  it('Requirement 20: UI renders all core sections and works interactively', async () => {
    render(<App defaultMode="roulette" />);

    // Check title is rendered
    expect(await screen.findByText('Adaptive Roulette Mathematics')).toBeInTheDocument();

    // Check 5-slot sliding history section is rendered
    expect(screen.getByText('5-Slot Sliding History Window')).toBeInTheDocument();

    // Check input box is present
    const input = screen.getByPlaceholderText('e.g. 0, 7, 23');
    expect(input).toBeInTheDocument();

    // Check Green Zero button is present
    const chip0 = screen.getByRole('button', { name: /#0 green zero/i });
    expect(chip0).toBeInTheDocument();

    // Check 1–36 quick grid button for number 3
    const chip3 = screen.getByRole('button', { name: /#3 red odd/i });
    expect(chip3).toBeInTheDocument();

    // Check progress indicator
    expect(screen.getByText(/Results collected: 0\/5/i)).toBeInTheDocument();

    // Enter number 3 via input
    fireEvent.change(input, { target: { value: '3' } });
    expect(screen.getByText(/Preview classification for/i)).toBeInTheDocument();

    // Submit number 3
    const addBtn = screen.getByRole('button', { name: /Add Result/i });
    fireEvent.click(addBtn);

    // After adding 3, results collected should become 1/5
    await waitFor(() => {
      expect(screen.getByText(/Results collected: 1\/5/i)).toBeInTheDocument();
    });

    // Verify 3 appears in the 5-slot history window
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('Maintains usability at mobile viewport widths (375px)', async () => {
    window.innerWidth = 375;
    window.innerHeight = 667;
    window.dispatchEvent(new Event('resize'));

    render(<App defaultMode="roulette" />);

    expect(await screen.findByText('Adaptive Roulette Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Enter Roulette Outcome (0–36)')).toBeInTheDocument();
  });

  it('Maintains usability at desktop viewport widths (1440px)', async () => {
    window.innerWidth = 1440;
    window.innerHeight = 900;
    window.dispatchEvent(new Event('resize'));

    render(<App defaultMode="roulette" />);

    expect(await screen.findByText('Adaptive Roulette Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Next Spin Recommendation & Signals')).toBeInTheDocument();

    // Toggle advanced math analytics
    const toggleBtn = screen.getByRole('button', { name: /Show Deep Mathematical/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText('House Edge & Expected Value (EV) Calculator')).toBeInTheDocument();
  });
});
