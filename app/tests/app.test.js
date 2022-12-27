const {
    createPost,
    getPost,
    updatePost,
    deletePost,
    buildResponse
} = require('../app')

let post = {
    owner: "userteste@gmail.com",
    image: "teste :url bucket s3",
    text: "teste: olá, hoje estou pensando...",
    video: "teste: url bucket s3"
}
let postThatAlreadyExists = { //verificar na tabela
    post_id: "29821158-2821-4929-92dd-476f0bb42a6c",
    owner: "userteste@gmail.com"
}

test('Create Post', async () => {
    let postCreated = await createPost(post)
    const result = JSON.stringify(postCreated)
    expect(result).toMatch(/SUCCESS/)
});

test('Get all posts', async () => {
    let posts = await getPost()
    expect(posts.body).toMatch(/image/)
    expect(posts.body).toMatch(/post_id/)
    expect(posts.body).toMatch(/updatedAt/)
    expect(posts.body).toMatch(/text/)
    expect(posts.body).toMatch(/owner/)
    expect(posts.body).toMatch(/video/)
});

test('Get One Post', async () => {
    let post = await getPost(postThatAlreadyExists)
    expect(post.body).toMatch(/image/)
    expect(post.body).toMatch(/post_id/)
    expect(post.body).toMatch(/updatedAt/)
    expect(post.body).toMatch(/text/)
    expect(post.body).toMatch(/owner/)
    expect(post.body).toMatch(/video/)
});

test('update Post', async () => {
    postThatAlreadyExists.image = "Alterado via teste4"
    postThatAlreadyExists.text = "Alterado via teste4"
    postThatAlreadyExists.video = "Alterado via teste4"
    postThatAlreadyExists.updatedAt = (new Date()).toString()
    let post = await updatePost(postThatAlreadyExists)
    expect(post.body).toBe("{\"message\":\"Post editado com sucesso!\"}")
});

test('Delete Post', async () => {
    let post = await deletePost(postThatAlreadyExists)
    expect(post.body).toBe("{\"message\":\"Post deletado com sucesso!\"}")
});


test('Building Response', async () => {
    expect(buildResponse(200, { testResult: "ok" })
        .toString()).toBe((
            {
                "body": { "testResult": "ok" },
                "headers": { "Content-Type": "application/json" },
                "statusCode": 200
            })
            .toString())
});

