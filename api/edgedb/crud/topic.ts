import { Topic } from "../cli/cli"
import { client } from "../client"
import e from "../dbschema/edgeql-js"

// Add a topic to a wiki of a user
// Also add links to GlobalLink and have references
export async function addTopic(topic: Topic, wikiId: string) {
  const addGlobalLinkQuery = e.params(
    {
      url: e.str,
      urlTitle: e.str,
      public: e.bool,
      year: e.optional(e.str),
    },
    (params) => {
      e.insert(e.GlobalLink, {
        urlTitle: params.urlTitle,
        url: params.url,
        public: params.public,
      })
    },
  )

  topic.links.map((link) => {
    addGlobalLinkQuery.run(client, {
      url: link.url,
      urlTitle: link.title,
      public: true,
      year: link?.year,
    })
  })

  const query = e.params(
    {
      wikiId: e.uuid,
      topic: e.tuple({
        name: e.str,
        prettyName: e.str,
        public: e.bool,
        content: e.str,
      }),
      notes: e.json,
      links: e.json,
    },
    (params) => {
      const newTopic = e
        .insert(e.Topic, {
          wiki: e.assert_exists(
            e.assert_single(
              e.select(e.Wiki, (wiki) => ({
                filter: e.op(wiki.id, "=", e.uuid(wikiId)),
              })),
            ),
          ),
          name: topic.name,
          prettyName: topic.prettyName,
          public: topic.public,
          content: topic.content,
        })
        // don't crash on conflicts
        // TODO: check it actually works
        .unlessConflict((topic) => ({
          on: topic.name,
        }))
      return e.with(
        [newTopic],
        e.select(
          e.op(
            e.for(e.json_array_unpack(params.notes), (note) =>
              e.insert(e.Note, {
                content: e.cast(e.str, e.json_get(note, "content")),
                url: e.cast(e.str, e.json_get(note, "url")),
                public: e.cast(e.bool, e.json_get(note, "public")),
                topic: newTopic,
              }),
            ),
            "union",
            e.for(e.json_array_unpack(params.links), (link) =>
              e.insert(e.Link, {
                title: e.cast(e.str, e.json_get(link, "title")),
                url: e.cast(e.str, e.json_get(link, "url")),
                description: e.cast(e.str, e.json_get(link, "description")),
                public: e.cast(e.bool, e.json_get(link, "public")),
                topic: newTopic,
              }),
            ),
          ),
        ),
      )
    },
  )
  return query.run(client, {
    wikiId,
    topic: {
      name: topic.name,
      prettyName: topic.prettyName,
      public: topic.public,
      content: topic.content,
    },
    links: topic.links,
    notes: topic.notes,
  })
}

// Get all details to render the topic page
// learn-anything.xyz/<global-topic>
export async function getGlobalTopic(topicName: string) {
  const query = e.select(e.Topic, (topic) => ({
    filter: e.op(topic.name, "=", topicName),
    name: true,
    content: true,
    notes_count: e.count(topic.notes),
    link_count: e.count(topic.links),
    notes: {
      content: true,
      url: true,
      additionalContent: true,
    },
    links: {
      title: true,
      url: true,
      description: true,
      relatedLinks: {
        title: true,
        url: true,
        description: true,
      },
    },
  }))
  return query.run(client)
}

export async function topicExists(topicName: string) {
  const query = e.select(e.Topic, (topic) => ({
    filter: e.op(topic.name, "=", topicName),
  }))
  const res = await query.run(client)
  if (res.length === 0) {
    return false
  }
  return true
}

// export interface Link {
//   title: string
//   url: string
//   description: string | null
//   public: boolean
//   related: RelatedLink[]
// }

// export interface RelatedLink {
//   title: string
//   url: string
// }

// export interface Note {
//   content: string
//   public: boolean
//   url: string | null
// }

// // interface OldTopic {
// //   name: string
// //   content: string
// //   parentTopic: string | null
// //   public: boolean
// //   notes: Note[]
// //   links: Link[]
// //   prettyName: string
// // }

export async function deleteTopic(id: string) {
  const res = await e
    .delete(e.Topic, (topic) => ({
      filter: e.op(topic.id, "=", id),
    }))
    .run(client)
  return res
}

export async function getTopics() {
  const res = await e
    .select(e.Topic, () => ({
      name: true,
      content: true,
      id: true,
    }))
    .run(client)
  return res
}

export async function getTopic(topicName: string, userId: string) {
  const res = await e
    .select(e.Topic, (topic) => ({
      name: true,
      content: true,
      prettyName: true,
      notes: {
        content: true,
        url: true,
      },
      links: {
        title: true,
        url: true,
      },
      filter: e.op(
        e.op(topic.name, "=", topicName),
        "and",
        e.op(topic.user.id, "=", e.cast(e.uuid, userId)),
      ),
    }))
    // .toEdgeQL()
    .run(client)
  return res
}

export async function getTopicCount(userId: string) {
  const res = await e
    .select(e.User, (user) => ({
      topicCount: e.count(user.topics),
    }))
    .run(client)
  return res
}

export async function getSidebar(userId: string) {
  const res = await e
    .select(e.Topic, (topic) => ({
      name: true,
      prettyName: true,
    }))
    .run(client)
  console.log(res, "res")
  return res
}

// connections between topics
// for force graph visualization
export async function getTopicGraph(userId: string) {
  const res = await e
    .select(e.Topic, (topic) => ({
      name: true,
      prettyName: true,
    }))
    .run(client)
  console.log(res, "res")
  return res
}

export async function getLinkCountForTopic(topicName: string, userId: string) {
  const res = await e
    .select(e.Topic, (topic) => ({
      name: true,
      content: true,
      notes: true,
      links: true,
      filter: e.op(
        e.op(topic.name, "=", topicName),
        "and",
        e.op(topic.user.id, "=", e.cast(e.uuid, userId)),
      ),
    }))
    .toEdgeQL()
  // .run(client)
  console.log(res)
  return res
}
