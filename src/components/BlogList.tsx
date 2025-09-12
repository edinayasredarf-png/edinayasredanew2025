import Image from 'next/image'
import Link from 'next/link'

interface BlogPost {
  id: number
  title: string
  description: string
  date: string
  image: string
  category: string
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Заголовок статьи блога в несколько строк",
    description: "Описание статьи блога в несколько строк, краткое описание о чем статья, описание статьи блога в несколько строк.",
    date: "12.10.2023",
    image: "/img/blog1.svg",
    category: "Новости"
  },
  {
    id: 2,
    title: "Заголовок статьи блога в несколько строк",
    description: "Описание статьи блога в несколько строк, краткое описание о чем статья, описание статьи блога в несколько строк.",
    date: "12.10.2023",
    image: "/img/blog2.svg",
    category: "Обновления"
  },
  // Добавьте больше статей по необходимости
]

const BlogList = () => {
  return (
    <div className="w-full bg-[#f2f3f7]">
      <div className="max-w-[1440px] mx-auto px-[34px] py-10">
        <h1 className="text-[32px] font-bold text-[#292c32] mb-8">Блог</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl overflow-hidden">
              <div className="relative h-[240px]">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#676e7e] text-sm">{post.category}</span>
                  <span className="text-[#676e7e] text-sm">{post.date}</span>
                </div>
                <h2 className="text-[#292c32] text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-[#676e7e] text-base mb-4">{post.description}</p>
                <Link
                  href={`/blog/${post.id}`}
                  className="inline-flex items-center text-[#2777ff] hover:underline"
                >
                  Читать далее
                  <svg className="ml-2 w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BlogList
