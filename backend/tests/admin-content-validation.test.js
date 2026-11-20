'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const ContentPage = require('../models/ContentPage');
const Ingredient = require('../models/Ingredient');
const {
  InputValidationError,
  parseAdminContentPage,
  parseAdminIngredient,
  parseAdminIngredientListQuery,
  parseContentPageKey,
} = require('../validators/adminContent');

test('content page keys are restricted to the managed pages', () => {
  assert.equal(parseContentPageKey('about-us'), true);
  assert.equal(parseContentPageKey('our-science'), true);
  assert.equal(parseContentPageKey('contact'), false);
  assert.equal(parseContentPageKey('../admin'), false);
});

test('content page drafts can be empty, while published pages require approved copy', () => {
  assert.deepEqual(parseAdminContentPage({
    title: '',
    introduction: '',
    sections: [],
    status: 'draft',
  }), {
    title: '',
    introduction: '',
    sections: [],
    status: 'draft',
  });

  assert.throws(
    () => parseAdminContentPage({
      title: 'About',
      introduction: '',
      sections: [],
      status: 'published',
    }),
    InputValidationError,
  );
  assert.deepEqual(parseAdminContentPage({
    title: 'About',
    introduction: 'Approved brand introduction',
    sections: [{ heading: 'Our approach', body: 'Approved editorial copy' }],
    status: 'published',
  }).sections, [{ heading: 'Our approach', body: 'Approved editorial copy' }]);
});

test('content page updates reject fields outside the editor contract', () => {
  assert.throws(
    () => parseAdminContentPage({
      title: 'About',
      introduction: '',
      sections: [],
      status: 'draft',
      clinicalClaims: ['unverified'],
    }),
    InputValidationError,
  );
});

test('ingredient list query validates search, status, and bounded pagination', () => {
  assert.deepEqual(parseAdminIngredientListQuery({
    search: '  peptide ',
    status: 'published',
    page: '2',
    limit: '50',
  }), {
    page: 2,
    limit: 50,
    search: 'peptide',
    status: 'published',
  });
  assert.throws(
    () => parseAdminIngredientListQuery({ page: '0', limit: '1000', status: 'active' }),
    InputValidationError,
  );
});

test('ingredient input normalizes slugs and prevents unsupported claim fields', () => {
  assert.deepEqual(parseAdminIngredient({
    name: 'Ingredient',
    inci: '',
    slug: 'Ingredient-Name',
    summary: '',
    monograph: '',
    sortOrder: 5,
    status: 'draft',
  }), {
    name: 'Ingredient',
    inci: '',
    slug: 'ingredient-name',
    summary: '',
    monograph: '',
    sortOrder: 5,
    status: 'draft',
  });
  assert.throws(
    () => parseAdminIngredient({
      name: 'Ingredient',
      slug: 'ingredient',
      status: 'published',
      sortOrder: 0,
      clinicalEvidence: 'invented',
    }),
    InputValidationError,
  );
  assert.throws(
    () => parseAdminIngredient({
      name: 'Ingredient',
      slug: 'ingredient',
      summary: '',
      monograph: '',
      sortOrder: 0,
      status: 'published',
    }),
    InputValidationError,
  );
});

test('content models reject unsupported fields and use draft-only defaults', async () => {
  const contentPage = new ContentPage({ key: 'about-us' });

  assert.equal(contentPage.status, 'draft');
  await assert.doesNotReject(contentPage.validate());
  assert.throws(() => new Ingredient({
    name: 'Ingredient',
    slug: 'ingredient',
    clinicalClaims: ['unsupported'],
  }), { name: 'StrictModeError' });
});
