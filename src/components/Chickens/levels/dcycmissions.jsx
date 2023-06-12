export const fetchLevels = async (rpc) => {
  try {
    const response = await rpc.get_table_rows({
      code: 'dcycmissions',
      scope: 'dcycmissions',
      table: 'levelup',
      limit: 1000,
    });

    if (response.rows && response.rows.length > 0) {
      return response.rows;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching levels:', error);
    return [];
  }
};