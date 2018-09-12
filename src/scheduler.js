function createScheduler() {
  let data = [];

  return {
    data,
    async getAll(pathname) {
      if (!pathname) {
        return data;
      }
      return data.filter(item => item.pathname.startsWith(pathname));
    },
    async has(pathname) {
      return data.findIndex(item => item.pathname === pathname) > -1;
    },
    async get(pathname) {
      return data.find(item => item.pathname === pathname);
    },
    async put(pathname, meta) {
      const item = await this.get(pathname);
      if (item) {
        item.views.push(meta);
        return item;
      } else {
        const newItem = {
          pathname,
          views: [meta],
        };
        data.push(newItem);
        return newItem;
      }
    },
  };
}

module.exports = createScheduler();
