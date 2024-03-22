"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { usePathname, useRouter } from "next/navigation"
import { CommentValidation } from "@/lib/validations/thread"
import { addCommentToThread } from "@/lib/actions/thread.action"
import { Input } from "../ui/input"
import Image from "next/image"

interface Props {
  threadId: string
  currentUserImg: string
  currentUserId: string
}

const Comment = ({ threadId, currentUserImg, currentUserId }: Props) => {
  const router = useRouter()
  const pathname = usePathname()

  const form = useForm({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      thread: "",
    },
  })

  // 2. Define a submit handler.
  const onSubmit = (values: z.infer<typeof CommentValidation>) => {
    addCommentToThread({
      threadId: threadId,
      userId: JSON.parse(currentUserId),
      commentText: values.thread,
      path: pathname,
    })

    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="comment-form">
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="flex items-center w-full gap-3 ">
              <Image
                src={currentUserImg}
                alt="user avatar"
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
              <FormControl className="border-none bg-transparent">
                <Input
                  placeholder="Comment..."
                  className="no-focus text-light-1 outline-none"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="comment-form_btn">
          Reply
        </Button>
      </form>
    </Form>
  )
}

export default Comment
