## models/Article.ts 
-is used for defining the schemas of the articles that will be stored in mongodb.

1. models/Article.ts
Purpose: Defines the data schema and TypeScript interface for your articles stored in MongoDB.

What it contains:

The Mongoose schema (ArticleSchema) which defines the shape of an article document (title, content, tags, timestamps).

The TypeScript interface (IArticle) that describes the article shape in your app code (helps with type safety).

The Mongoose model export (mongoose.model<IArticle>("Article", ArticleSchema)) which you use to query and manipulate articles in MongoDB.

Summary: This file tells MongoDB and your code what an article is.

## lib/mongodb.ts
- this is used for connecting to the databse.

2. lib/mongodb.ts
Purpose: Handles the connection to your MongoDB database.

What it does:

Reads your MongoDB URI from environment variables.

Connects to MongoDB using Mongoose, caches the connection to avoid reconnecting unnecessarily.

Returns the connection for use in other files.

Summary: This file makes sure your app can talk to your MongoDB database efficiently.

## app/articles/page.tsx
this page gets all the articles from mongodb and display them to the user.

3. app/articles/page.tsx (Server Component)
Purpose: The main articles listing page, fetches all articles from MongoDB on the server side and passes them to a client component for display.

What it does:

Checks the user’s session for authorization.

Connects to the database.

Queries articles from MongoDB, sorts them by newest first.

Converts MongoDB data (_id, Dates) to plain serializable strings.

Passes the list of serialized articles to the client component <ArticleSection />.

Returns JSX for rendering the article list page.

Summary: Server-side logic to fetch articles securely and efficiently, and renders the articles list page.

## components/ArticleSection.tsx
- this page displays list of articles from the server?????

4. components/ArticleSection.tsx (Client Component)
Purpose: Displays the list of articles received from the server.

What it does:

Receives the articles as props.

If no articles, shows a friendly "No articles found" message.

Otherwise, renders a grid of article cards with title, excerpt (content snippet), and tags.

Each article card links to the detailed article page (/articles/[id]).

Summary: UI component that presents your articles in a clean, user-friendly way.


## app/articles/[id]/page.tsx
- this page is an individual page for all the articles.

5. app/articles/[id]/page.tsx (Server Component)
Purpose: Displays the full detail of a single article.

What it does:

Fetches the article by ID from MongoDB.

Converts MongoDB fields to strings for serialization.

If no article found, triggers Next.js's notFound() (404).

Renders the article’s title, content, publish date, and tags nicely formatted.

Optional: generates SEO metadata (title and description) based on article content.

Summary: Server-side detail page showing one article in full.

## 

TODO
delete unused packages and libraries
the latest articles in article/page.tsx should appera on top and also add pagination here and filtering.
add cursor-pointer on next & previous pagination.


