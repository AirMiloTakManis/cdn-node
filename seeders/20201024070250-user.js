const bcrypt = require('bcrypt');
const faker = require('faker');
const helper = require('../helper');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Users', [{
      name: 'johndoe',
      email: 'johndoe@example.com',
      phone: '+601111111111',
      password: bcrypt.hashSync('password', bcrypt.genSaltSync()),
      RoleId: 1,
      image: helper.getRandomImage(),
      verifiedAt: faker.date.past(2),
      username: 'admin',
      skillsets: faker.name.jobTitle(),
      hobby: faker.name.jobType(),
    },
    ...[...Array(100)].map(() => ({
      name: faker.name.findName(),
      email: faker.internet.email(),
      phone: faker.phone.phoneNumber(),
      password: bcrypt.hashSync('password', bcrypt.genSaltSync()),
      // RoleId: Math.floor((Math.random() * 4) + 1),
      RoleId: 2,
      image: faker.random.arrayElement([helper.getRandomImage(), '']),
      verifiedAt: faker.random.boolean() ? null : faker.date.past(2),
      username: faker.name.firstName() + faker.name.jobType(),
      skillsets: faker.name.jobTitle(),
      hobby: faker.name.jobType(),
    })),
    ], {});
  },

  down: async (queryInterface) => queryInterface.bulkDelete('Users', null, {}),
};
