export class NotRelevantError extends Error {
  constructor() {
    super('Please only ask questions related to pregnancy and childcare.');
    this.name = 'NotRelevantError';
  }
}