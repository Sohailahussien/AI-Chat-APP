const mockPipeline = jest.fn();

export const pipeline = mockPipeline;
export const env = {
  localModelPath: jest.fn(),
}; 