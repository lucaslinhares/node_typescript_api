//declare namespace NodeJS {
//interface Global {
//    testRequest: import('supertest').SuperTest<import('supertest').Test>;
//}
//}

declare var testRequest: import('supertest').SuperTest<
  import('supertest').Test
>;
