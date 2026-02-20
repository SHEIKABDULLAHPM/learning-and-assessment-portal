import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../../services/api";

export default function CourseList() {
  const { data: courses, isLoading, isError } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await api.get("/courses");
      return res.data;
    },
  });

  if (isLoading)
    return <Loader2 className="animate-spin h-8 w-8 mx-auto mt-10" />;

  if (isError)
    return (
      <div className="p-6 text-center text-red-500">
        Unable to load courses. Please try again later.
      </div>
    );

  const courseList = courses ?? [];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Available Courses</h1>
      {courseList.length === 0 ? (
        <div className="text-center text-gray-500">No courses available yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseList.map((course) => (
            <div
              key={course.courseId}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Thumbnail</span>
              </div>
              <div className="p-5">
                <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                  {course.category}
                </div>
                <h3 className="mt-1 text-lg font-medium text-black">
                  {course.title}
                </h3>
                <p className="mt-2 text-gray-500 text-sm line-clamp-3">
                  {course.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Instr: {course.instructor?.fullName || "TBA"}
                  </span>
                  <Link
                    to={`/student/courses/${course.courseId}/learn`}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                  >
                    Start Learning
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
