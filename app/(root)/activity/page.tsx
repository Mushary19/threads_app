import { fetchUser, getActivity } from "@/lib/actions/user.action"
import { currentUser } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

const Page = async () => {
  const user = await currentUser()
  if (!user) return null

  const userInfo = await fetchUser(user.id)

  if (!userInfo?.onboarded) redirect("/onboarding")

  // Get activity or Notifications
  const activity = await getActivity(userInfo._id)

  return (
    <section>
      <h1 className="head-text mt-7">Activity</h1>

      <section className="mt-10 flex flex-col gap-5">
        {activity.length > 0 ? (
          <>
            {activity.map((activity) => (
              <Link key={activity._id} href={`/thread/${activity.parentId}`}>
                <article className="activity-card">
                  <Link href={`/profile/${activity.author.id}`}>
                    <Image
                      src={activity.author.image}
                      alt="Profile Photo"
                      width={20}
                      height={20}
                      className="rounded-full object-cover"
                    />
                  </Link>
                  <p className="!text-small-regular text-light-1">
                    <span className="mr-1 text-primary-500">
                      {activity.author.name}
                    </span>{" "}
                    <span>replied to your thread</span>
                  </p>
                </article>
              </Link>
            ))}
          </>
        ) : (
          <p className="!text-base-regular text-light-3">No Activity Yet</p>
        )}
      </section>
    </section>
  )
}

export default Page
