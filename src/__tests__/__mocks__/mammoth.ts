const mammoth = {
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Mocked DOCX content',
    messages: []
  }),
  convertToHtml: jest.fn().mockResolvedValue({
    value: '<p>Mocked DOCX content</p>',
    messages: []
  })
};

export default mammoth; 