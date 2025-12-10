import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Launcher from '../src/components/Launcher';

describe('Launcher Component', () => {
  it('renders correctly', () => {
    render(<Launcher />);
    expect(screen.getByText(/INITIALIZING.../i)).toBeInTheDocument();
  });
});
