process.env.EXPECTED_EXPORTER_VERSION = '2.2.2';

jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn().mockImplementation((sql, positionalParams) => {
      if (sql === 'SELECT 1;') return { rowCount: 1 };
      if (sql === `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'qlik';`)
        return { rowCount: 0 };
      if (positionalParams && positionalParams[0] === '8e236ed7-ef53-4238-b0a4-54c5f4292edf')
        return { rows: [] };
      if (positionalParams && positionalParams[0] === 'wrong-id') return { rows: [] };
      const rows = [
        {
          id: '8e236ed7-ef53-4238-b0a4-54c5f4293edf',
          text: 'level',
          palindrome: true,
        },
      ];
      return { rows };
    }),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});
