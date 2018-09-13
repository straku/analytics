function convertMapToArray(map) {
  let array = [];
  for (const [pathname, views] of map) {
    array.push({
      pathname,
      ...views,
    });
  }
  return array;
}

function createScheduler() {
  const data = new Map();

  return {
    getAll(pathname) {
      const serializedData = convertMapToArray(data);
      if (!pathname) {
        return serializedData;
      }
      return serializedData.filter(item => item.pathname.startsWith(pathname));
    },
    has(pathname) {
      return data.has(pathname);
    },
    get(pathname) {
      return data.get(pathname);
    },
    put(pathname, meta) {
      const item = data.get(pathname);
      if (item) {
        item.views.push(meta);
        return item;
      } else {
        const newItem = {
          views: [meta],
        };
        data.set(pathname, newItem);
        return newItem;
      }
    },
  };
}

module.exports = createScheduler();
