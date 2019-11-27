import { getNewDefaultMutations } from '../../lib/server/default_mutations2';
import SimpleSchema from 'simpl-schema';
import Users from 'meteor/vulcan:users';

import expect from 'expect';
import { createDummyCollection } from 'meteor/vulcan:test';
const test = it;


describe('vulcan:lib/default_mutations', function () {

    it('returns mutations', function () {
        const mutations = getNewDefaultMutations({
            typeName: 'Foo',
            collectionName: 'Foos',
            options: {}
        });
        expect(mutations.create).toBeDefined();
        expect(mutations.update).toBeDefined();
        expect(mutations.delete).toBeDefined();
    });
    it('preserves openCRUD backward compatibility', function () {
        const mutations = getNewDefaultMutations({
            typeName: 'Foo',
            collectionName: 'Foos',
            options: {}
        });
        expect(mutations.new).toBeDefined();
        expect(mutations.edit).toBeDefined();
        expect(mutations.remove).toBeDefined();
    });

    describe('delete mutation', () => {
        const foo = { _id: 'foo' };
        const Foos = createDummyCollection({
            results: {
                findOne: foo
            },
            collectionName: 'Foos',
            schema: { _id: { type: String, canRead: ['admins'] } }
        })
        const context = {
            Users,/*: {
                options: {
                    collectionName: 'Users',
                    typeName: 'User'
                },
                simpleSchema: () => new SimpleSchema({ _id: { type: String, canRead: ['admins'] } }),
                restrictViewableFields: (currentUser, collection, doc) => doc
            },*/
            Foos,
            currentUser: {
                isAdmin: true,
                groups: ['admins']
            }
        };
        const mutations = getNewDefaultMutations({
            typeName: 'Foo',
            collectionName: 'Foos',
            options: {}
        });
        test('refuse deletion if selector is empty', async () => {
            const { delete: deleteMutation } = mutations;
            const emptySelector = {};
            const nullSelector = { documentId: null };
            const validIdSelector = { _id: 'foobar' };
            const validDocIdSelector = { documentId: 'foobar' };
            const validSlugSelector = { slug: 'foobar' };

            // const { mutation } = deleteMutation; // won't work because "this" must equal deleteMutation to access "check"
            await expect(deleteMutation.mutation(null, { selector: emptySelector }, context)).rejects.toThrow();
            await expect(deleteMutation.mutation(null, { selector: nullSelector }, context)).rejects.toThrow();

            await expect(deleteMutation.mutation(null, { selector: validIdSelector }, context)).resolves.toEqual({ data: foo });
            await expect(deleteMutation.mutation(null, { selector: validDocIdSelector }, context)).resolves.toEqual({ data: foo });
            await expect(deleteMutation.mutation(null, { selector: validSlugSelector }, context)).resolves.toEqual({ data: foo });
        });

    });


});