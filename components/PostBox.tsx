import { useSession } from "next-auth/react";
import React, { useState } from "react";
import Avatar from "./Avatar";
import { LinkIcon, PhotographIcon } from "@heroicons/react/outline";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { ADD_POST, ADD_SUBREDDIT } from "../graphql/mutations";
import { GET_ALL_POSTS, GET_SUBREDDIT_BY_TOPIC } from "../graphql/queries";
import client from "../apollo-client";
import toast from "react-hot-toast";

// Typage de donnée
type FormData = {
  postTitle: string;
  postBody: string;
  postImage: string;
  subreddit: string;
};

type Props = {
  subreddit?: string;
};

const PostBox = ({ subreddit }: Props) => {
  const { data: session } = useSession();
  const [addPost] = useMutation(ADD_POST, {
    refetchQueries: [GET_ALL_POSTS, "getPostList"],
  });
  const [addSubreddit] = useMutation(ADD_SUBREDDIT);

  const [imageBoxOpen, setImageBoxOpen] = useState<boolean>(false);

  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = handleSubmit(async (FormData) => {
    console.log(FormData);
    const notifications = toast.loading("Creating new Post.....");

    try {
      // query for the subreddit topic...
      const {
        data: { getSubredditListByTopic },
      } = await client.query({
        query: GET_SUBREDDIT_BY_TOPIC,
        variables: {
          topic: subreddit || FormData.subreddit,
        },
      });

      const subredditExists = getSubredditListByTopic.length > 0;

      if (!subredditExists) {
        // create subreddit.....
        console.log("Subreddit is new! - Creating a NEW subreddit!");

        const {
          data: { insertSubreddit: newSubreddit },
        } = await addSubreddit({
          variables: {
            topic: FormData.subreddit,
          },
        });

        console.log("Creating post.....", FormData);
        const image = FormData.postImage || "";

        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: FormData.postBody,
            image: image,
            subreddit_id: newSubreddit.id,
            title: FormData.postTitle,
            username: session?.user?.name,
          },
        });

        console.log("New post added:", newPost);
      } else {
        // use existing subreddit
        console.log("Using existing subreddit!");
        console.log(getSubredditListByTopic);

        const image = FormData.postImage || "";

        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: FormData.postBody,
            image: image,
            subreddit_id: getSubredditListByTopic[0].id,
            title: FormData.postTitle,
            username: session?.user?.name,
          },
        });

        console.log("New post added:", newPost);
      }

      //   After the post has been added!
      setValue("postBody", "");
      setValue("postImage", "");
      setValue("postTitle", "");
      setValue("subreddit", "");

      toast.success("New Post Created!", {
        id: notifications,
      });
    } catch (error) {
      toast.error("OOOOPSSSS Something went wrong!", {
        id: notifications,
      });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="sticky top-16 z-50 bg-white border rounded-md border-gray-300 p-2"
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <Avatar />

        {/* Create a post */}
        <input
          // connect my input
          {...register("postTitle", { required: true })}
          disabled={!session}
          className="flex-1 rounded-md bg-gray-50 p-2 pl-5 outline-none"
          type="text"
          placeholder={
            session
              ? subreddit
                ? `Create a post in r/${subreddit}`
                : `Create a post by entering a title!`
              : "Sign In to post"
          }
        />

        <PhotographIcon
          onClick={() => setImageBoxOpen(!imageBoxOpen)}
          className={`h-6 cursor-pointer text-gray-300 ${
            imageBoxOpen && "text-blue-300"
          }`}
        />
        <LinkIcon className="h-6 text-gray-300" />
      </div>

      {!!watch("postTitle") && (
        <div className="flex flex-col py-2">
          {/* Body */}
          <div className="flex items-center px-2">
            <p className="min-w-[90px]">Body:</p>
            <input
              className="m-2 flex-1 bg-blue-50 p-2 outline-none"
              {...register("postBody")}
              type="text"
              placeholder="Text (Optional)"
            />
          </div>

          {/* Subreddit  */}
          {!subreddit && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Subreddit:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register("subreddit", { required: true })}
                type="text"
                placeholder="i.e reactjs"
              />
            </div>
          )}

          {/* ImageURL */}
          {imageBoxOpen && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Image URL:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register("postImage")}
                type="text"
                placeholder="Optional..."
              />
            </div>
          )}

          {/* Errors */}

          {Object.keys(errors).length > 0 && (
            <div className="space-y-2 p-2 text-red-500">
              {errors.postTitle?.type === "required" && (
                <p>- A Post Title is required.</p>
              )}

              {errors.subreddit?.type == "required" && (
                <p>- A Subreddit is required.</p>
              )}
            </div>
          )}

          {!!watch("postTitle") && (
            <button
              type="submit"
              className="w-full rounded-full bg-blue-400 p-2 text-white"
            >
              Create Post
            </button>
          )}
        </div>
      )}
    </form>
  );
};

export default PostBox;
