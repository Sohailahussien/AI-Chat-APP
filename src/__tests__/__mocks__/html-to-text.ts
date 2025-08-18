export const htmlToText = jest.fn().mockImplementation((html) => {
  return html.replace(/<[^>]*>/g, '');
}); 