const pdfParse = jest.fn().mockResolvedValue({
  text: 'Mocked PDF content',
  numpages: 1,
  info: {
    Title: 'Mock PDF',
    Author: 'Test Author',
  },
});

export default pdfParse; 